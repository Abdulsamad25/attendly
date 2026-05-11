import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, Eye, EyeOff } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../lib/AuthContext";

// NEW VERSION - Clean implementation

const AdminRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    email: "",
    organizationName: "",
    password: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!formData.jobTitle.trim()) {
      setError("Job title is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return;
    }
    if (!formData.organizationName.trim()) {
      setError("Organization name is required");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!formData.acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      // Call admin registration API
      const response = await fetch(
        "http://localhost:5000/api/auth/admin/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminName: formData.fullName,
            companyName: formData.organizationName,
            email: formData.email,
            password: formData.password,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      const { user, accessToken, refreshToken } = data;

      // Login user
      login(user, accessToken, refreshToken);

      // Navigate to admin dashboard
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-surface min-h-screen text-on-surface">
      {/* Top Navigation */}
      <nav className="top-0 z-50 fixed flex justify-between items-center bg-surface px-6 py-4 w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary text-xl tracking-tighter">
            Attendly
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-grow justify-center items-center px-4 md:px-8 pt-24 pb-12">
        <div className="items-stretch gap-8 grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl">
          {/* Left Side: Brand Narrative */}
          <div className="hidden md:flex flex-col justify-center space-y-4 pr-12">
            <div className="space-y-2">
             <h1 className="font-extrabold text-primary text-4xl leading-tight tracking-tighter">
                Powering the Future <br />
                of HR Operation.
              </h1>
              <p className="max-w-md text-gray-600 text-lg leading-relaxed">
                Join over 2,000+ organizations managing attendance, leaves, and
                payroll with surgical precision and effortless design.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="gap-4 grid grid-cols-2">
              <div className="space-y-2 bg-surface-container-low p-6 rounded-xl">
                <ShieldCheck size={32} className="text-primary" />
                <h3 className="font-semibold text-primary">ISO Certified</h3>
                <p className="text-gray-600 text-xs">
                  Bank-grade security and data encryption standards.
                </p>
              </div>
              <div className="space-y-2 bg-surface-container-low p-6 rounded-xl">
                <Zap size={32} className="text-primary" />
                <h3 className="font-semibold text-primary">Instant Setup</h3>
                <p className="text-gray-600 text-xs">
                  Onboard your entire team in less than 10 minutes.
                </p>
              </div>
            </div>

            {/* Testimonial Image */}
            <div className="relative bg-primary-container rounded-xl h-48 overflow-hidden">
              <img
                alt="Office environment"
                className="absolute inset-0 opacity-60 w-full h-full object-cover mix-blend-overlay"
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop"
              />
              <div className="absolute inset-0 flex justify-center items-center p-8">
                <p className="font-medium text-primary text-sm text-center italic">
                  "Attendly transformed how we track performance. The UI is so
                  clean our employees actually enjoy using it."
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="flex flex-col justify-center bg-white shadow-lg p-8 md:p-12 border border-gray-200/50 rounded-xl">
            <div className="mb-8">
              <h2 className="mb-2 font-bold text-gray-900 text-xl md:text-2xl tracking-tight">
                Create Admin Account
              </h2>
              
            </div>

            {error && (
              <div className="bg-red-50 mb-6 p-4 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name and Job Title Row */}
              <div className="gap-4 grid grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="HR Manager"
                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                  Work Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
                />
              </div>

              {/* Organization */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-600 text-xs uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="bg-gray-50 px-4 py-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 w-full text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="top-1/2 right-4 absolute text-gray-600 hover:text-gray-900 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-gray-600 text-xs italic">
                  Must be at least 8 characters with one number.
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 rounded focus:ring-primary text-primary"
                />
                <label
                  htmlFor="terms"
                  className="text-gray-600 text-xs leading-relaxed"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-medium text-primary hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-medium text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-primary-container shadow-lg shadow-primary/20 mt-4 py-4 rounded-xl w-full font-semibold text-white text-sm tracking-wide active:scale-95 transition-all"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  "Create Organization Account"
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 pt-6 border-gray-200 border-t text-center">
              <p className="text-gray-600 text-sm">
                Already have an admin account?{" "}
                <button
                  onClick={() => navigate("/admin-login")}
                  className="font-bold text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex md:flex-row flex-col justify-between items-center gap-4 mx-auto px-6 py-8 w-full max-w-7xl text-gray-600 text-xs">
        <p>© 2026 Attendly HR Technologies. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-all">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary transition-all">
            Terms of Service
          </a>
          <a href="#" className="hover:text-primary transition-all">
            Security
          </a>
          <a href="#" className="hover:text-primary transition-all">
            Status
          </a>
        </div>
      </footer>
    </div>
  );
};

export default AdminRegister;
