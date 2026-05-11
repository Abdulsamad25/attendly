/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

// Session timeout configuration (in minutes)
const INACTIVITY_TIMEOUT = 60; // Auto-logout after 60 minutes of inactivity
const WARNING_TIME = 5; // Show warning 5 minutes before logout

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const inactivityTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Logout function
  const performLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setShowInactivityWarning(false);
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    setShowInactivityWarning(false);

    // Clear existing timers
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Only set timers if user is logged in
    if (user) {
      // Warning timer (55 minutes for 60 minute timeout)
      warningTimeoutRef.current = setTimeout(
        () => {
          setShowInactivityWarning(true);
        },
        (INACTIVITY_TIMEOUT - WARNING_TIME) * 60 * 1000,
      );

      // Logout timer
      inactivityTimeoutRef.current = setTimeout(
        () => {
          performLogout();
          window.location.href = "/"; // Redirect to login/role selection
        },
        INACTIVITY_TIMEOUT * 60 * 1000,
      );
    }
  };

  // Rehydrate user from session storage on mount and check token expiry
  useEffect(() => {
    // Clean up legacy persistent auth from older versions
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    const stored = sessionStorage.getItem("user");
    const accessToken = sessionStorage.getItem("accessToken");
    let userData = null;

    if (stored && accessToken) {
      try {
        userData = JSON.parse(stored);

        // Check if token is expired
        if (isTokenExpired(accessToken)) {
          // Token expired, clear everything
          sessionStorage.clear();
          userData = null;
        } else {
          // Token valid, set user and start inactivity timer
          setUser(userData);
          resetInactivityTimer();
        }
      } catch (error) {
        sessionStorage.clear();
      }
    }

    setLoading(false);

    // Cleanup on unmount
    return () => {
      if (inactivityTimeoutRef.current)
        clearTimeout(inactivityTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    resetInactivityTimer();
  };

  const logout = () => {
    performLogout();
  };

  // Set up activity listeners when user logs in
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add activity listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user]);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        showInactivityWarning,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
