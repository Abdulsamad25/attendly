import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Helper function to check if JWT token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(jsonPayload);
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiryTime;
  } catch (error) {
    return true; // If we can't parse, assume expired
  }
};

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    // Token is expired, clear it and don't attach
    sessionStorage.removeItem("accessToken");
    // Let the response interceptor handle the 401
    return config;
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — try to refresh, otherwise log out
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const requestUrl = original?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/admin/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/admin/register") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/set-password");

    if (error.response?.status === 401 && !original?._retry && !isAuthRequest) {
      original._retry = true;

      try {
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          { refreshToken },
        );

        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.clear();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        // Let the calling page handle the error instead of forcing a full reload.
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
