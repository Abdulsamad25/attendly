import { useNavigate } from "react-router-dom";
import { Settings, User, ArrowRight } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: "admin",
      title: "Admin Portal",
      description:
        "Manage staff, review attendance, and process payroll. Full organizational oversight and configuration.",
      icon: Settings,
      signInText: "Admin Sign in",
      registerText: "Create Admin Account",
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-700",
      buttonColor: "text-indigo-700",
      hoverIconBg: "group-hover:bg-indigo-700",
      hoverIconText: "group-hover:text-white",
      accentBg: "bg-indigo-600/5 group-hover:bg-indigo-600/10",
      signInAction: () => navigate("/admin-login"),
      registerAction: () => navigate("/admin-register"),
    },
    {
      id: "staff",
      title: "Staff Portal",
      description:
        "Clock in, request leave, and view your records. Track your schedule and performance metrics.",
      icon: User,
      signInText: "Staff Sign in",
      registerText: "Create Staff Account",
      iconBg: "bg-purple-100",
      iconText: "text-purple-700",
      buttonColor: "text-purple-700",
      hoverIconBg: "group-hover:bg-purple-700",
      hoverIconText: "group-hover:text-white",
      accentBg: "bg-purple-600/5 group-hover:bg-purple-600/10",
      signInAction: () => navigate("/login"),
      registerAction: () => navigate("/register"),
    },
  ];

  return (
    <div className="flex flex-col justify-center items-center bg-surface p-6 min-h-screen overflow-hidden">
      {/* Fixed Top Header */}
      <header className="flex justify-center w-full">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-primary shadow-lg rounded-xl w-10 h-10">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          </div>
          <h1 className="font-extrabold text-primary text-xl md:text-2xl tracking-tighter">
            Attendly
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-10 w-full max-w-5xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h2 className="md:mb-4 mb-2 font-extrabold text-gray-900 text-xl md:text-4xl tracking-tight">
            Welcome back
          </h2>
          <p className="font-medium text-gray-600 text-sm md:text-lg">
            Please select your destination to continue.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="gap-8 grid grid-cols-1 md:grid-cols-2 mb-20 px-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="group relative flex flex-col items-start bg-white hover:shadow-2xl p-10 border-2 border-transparent hover:border-primary rounded-3xl overflow-hidden text-left transition-all hover:-translate-y-1 duration-300 portal-card"
              >
                {/* Background Accent Circle */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 ${role.accentBg} rounded-bl-full transition-all duration-300`}
                />

                {/* Icon Box */}
                <div
                  className={`mb-8 p-2 md:p-4 ${role.iconBg} ${role.iconText} rounded-xl ${role.hoverIconBg} ${role.hoverIconText} transition-colors duration-300`}
                >
                  <Icon className="size-5 md:size-10" />
                </div>

                {/* Content */}
                <div className="z-10 relative space-y-3">
                  <h3 className="font-bold text-gray-900 text-lg md:text-2xl tracking-tight">
                    {role.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {role.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-row flex-col gap-3 mt-8 w-full">
                  <button
                    onClick={role.signInAction}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-current ${role.buttonColor} text-sm font-bold hover:bg-black/5 transition-all`}
                  >
                    <span>{role.signInText}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={role.registerAction}
                    className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-bold text-white text-sm transition-all"
                  >
                    {role.registerText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Support Link */}
        <div className="text-center">
          <p className="font-medium text-gray-600 text-sm">
            Need help accessing your account?{" "}
            <a
              href="mailto:support@attendly.com"
              className="font-bold text-primary hover:underline underline-offset-4"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </main>

      {/* Decorative Blur Elements */}
      <div className="bottom-0 left-0 -z-10 fixed opacity-40 w-full h-96 pointer-events-none">
        <div className="-bottom-24 -left-24 absolute bg-primary-container blur-3xl rounded-full w-96 h-96" />
        <div className="-right-24 -bottom-24 absolute bg-purple-600 opacity-50 blur-3xl rounded-full w-96 h-96" />
      </div>

      <style>{`
        .portal-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .portal-card:hover {
          border-color: #222491;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(30, 34, 102, 0.08);
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;
