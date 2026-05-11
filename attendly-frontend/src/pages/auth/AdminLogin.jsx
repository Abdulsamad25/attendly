import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../lib/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      // Call admin login API
      const response = await fetch(
        "http://localhost:5000/api/auth/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      const { user, accessToken, refreshToken } = data;

      // Verify user is admin
      if (user.role !== "admin") {
        throw new Error("Invalid admin credentials");
      }

      // Login user
      login(user, accessToken, refreshToken);

      // Navigate to admin dashboard
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-surface selection:bg-secondary-container min-h-screen text-on-surface selection:text-on-secondary-container">
      {/* Top Navigation */}
      <header className="top-0 z-50 fixed flex justify-between items-center bg-surface px-6 py-4 w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-xl tracking-tighter">
            Attendly
          </span>
        </div>
      </header>

      {/* Main Entry Canvas */}
      <main className="flex justify-center items-center px-6 pt-20 pb-12 min-h-screen">
        <div className="items-center gap-12 grid md:grid-cols-2 w-full max-w-5xl">
          {/* Left Side: Branding & Visuals */}
          <div className="hidden md:flex flex-col space-y-8 pr-12">
            <div className="space-y-4">
              <span className="inline-flex items-center bg-secondary-container/20 px-3 py-1 rounded-md font-medium text-primary text-xs uppercase tracking-wider">
                Management Console
              </span>
              <h1 className="font-extrabold text-primary text-5xl leading-tight tracking-tighter">
                Powering the <br />
                Future of Work.
              </h1>
              <p className="max-w-md text-gray-600 text-lg leading-relaxed">
                The secure atrium for Attendly administrators. Manage
                operations, insights, and your global workforce from a single
                architectural interface.
              </p>
            </div>

            {/* Security Card */}
            <div className="group relative bg-surface-container-low hover:bg-surface-container p-6 rounded-xl overflow-hidden transition-all duration-300">
              <div className="z-10 relative flex flex-col gap-4">
                <div className="flex justify-center items-center bg-white/50 border border-gray-200 rounded-lg w-full h-[120px] overflow-hidden">
                  <img
                    alt="Security Dashboard"
                    className="opacity-40 grayscale w-full h-full object-cover mix-blend-multiply"
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex justify-center">
            <div className="p-0 rounded-xl w-full max-w-md">
              <div className="mb-8">
                <h2 className="font-bold text-gray-900 text-2xl tracking-tight">
                  Admin Sign in
                </h2>
                <p className="mt-1 text-gray-600 text-sm">
                  Welcome back. Enter your credentials to continue.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 mb-6 p-4 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    className="flex justify-between items-center font-semibold text-gray-600 text-xs uppercase tracking-widest"
                    htmlFor="email"
                  >
                    Work Email
                    <Mail size={16} className="text-gray-400" />
                  </label>
                  <input
                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-0 w-full text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                    id="email"
                    name="email"
                    placeholder="name@company.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-semibold text-gray-600 text-xs uppercase tracking-widest"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <a
                      className="font-medium text-primary text-xs hover:underline transition-all"
                      href="/forgot-password"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-0 w-full text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      className="top-1/2 right-4 absolute text-gray-400 hover:text-gray-600 transition-colors -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  className="bg-gradient-to-r from-primary to-primary-container shadow-lg shadow-primary/20 hover:shadow-primary/30 py-3.5 rounded-xl w-full font-semibold text-white active:scale-95 transition-all"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? <Spinner size="sm" /> : "Sign in to Console"}
                </button>
              </form>

              {/* Registration Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  New to Attendly?{" "}
                  <a
                    className="font-bold text-primary hover:underline transition-all"
                    href="/admin-register"
                  >
                    Create an admin account
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex md:flex-row flex-col justify-between items-center gap-4 mx-auto px-6 py-8 w-full max-w-7xl">
        <div className="flex flex-wrap justify-center gap-6">
          <a
            className="text-gray-600 hover:text-primary text-xs transition-all"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-gray-600 hover:text-primary text-xs transition-all"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-gray-600 hover:text-primary text-xs transition-all"
            href="#"
          >
            Security
          </a>
          <a
            className="text-gray-600 hover:text-primary text-xs transition-all"
            href="#"
          >
            Status
          </a>
        </div>
        <p className="text-gray-600 text-xs">
          © 2026 Attendly HR Technologies. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminLogin;
