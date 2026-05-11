const AuthLayout = ({ children }) => (
  <div className="flex bg-surface min-h-screen">
    {/* Left — branding panel */}
    <div className="hidden lg:flex flex-col justify-between bg-primary-dark p-12 lg:w-1/2">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex justify-center items-center bg-primary rounded-xl w-10 h-10">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        </div>
        <span className="font-bold text-white text-xl tracking-tight">
          Attendly
        </span>
      </div>

      {/* Hero text */}
      <div>
        <h1 className="mb-4 font-bold text-white text-4xl leading-tight">
          The modern pulse of your{" "}
          <span className="text-primary/80">workforce.</span>
        </h1>
        <p className="text-white/60 text-base leading-relaxed">
          Manage attendance, leave, and payroll deductions in one unified
          platform.
        </p>

        {/* Stats */}
        <div className="flex gap-6 mt-10">
          <div className="bg-white/10 px-5 py-4 rounded-xl">
            <p className="font-bold text-white text-2xl">99.9%</p>
            <p className="mt-0.5 text-white/50 text-xs uppercase tracking-wide">
              Uptime
            </p>
          </div>
          <div className="bg-white/10 px-5 py-4 rounded-xl">
            <p className="font-bold text-white text-2xl">15s</p>
            <p className="mt-0.5 text-white/50 text-xs uppercase tracking-wide">
              Check-in time
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-white/30 text-xs">
        © {new Date().getFullYear()} Attendly HR. All rights reserved.
      </p>
    </div>

    {/* Right — form panel */}
    <div className="flex flex-1 justify-center items-center p-6 lg:p-12">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          </div>
          <span className="font-bold text-primary-dark text-lg">Attendly</span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
