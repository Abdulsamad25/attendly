/* eslint-disable no-unused-vars */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  BookOpen,
  BadgeDollarSign,
  LogOut,
  HelpCircle,
  Fingerprint,
  Bell,
  Settings,
  User,
} from "lucide-react";
import GlobalSearch from "../../components/ui/GlobalSearch";
import NotificationDropdown from "../../components/ui/NotificationDropdown";
import { profileApi } from "../../api/admin";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/attendance", icon: CalendarClock, label: "Attendance" },
  { to: "/leave-request", icon: CalendarDays, label: "Leave Request" },
  { to: "/my-leaves", icon: BookOpen, label: "My Leaves" },
  { to: "/deductions", icon: BadgeDollarSign, label: "Deductions" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const bottomTabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/attendance", icon: CalendarClock, label: "Attendance" },
  { to: "/leave-request", icon: CalendarDays, label: "Leave" },
  { to: "/settings", icon: User, label: "Profile" },
];

const StaffLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        const res = await profileApi.get();
        if (res.data && res.data.profilePicture) {
          setProfilePic(res.data.profilePicture);
        }
      } catch (err) {
        // silently fail if we can't get the profile picture
      }
    };
    fetchProfilePic();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex bg-surface h-screen overflow-hidden">
      {/* Sidebar (desktop only) */}
      <aside className="hidden md:flex flex-col bg-white border-gray-100 border-r w-56 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-gray-100 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-primary text-sm leading-none">
                Attendly
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 gap-0.5 px-3 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary-light text-primary border-l-2 border-primary"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="flex flex-col gap-0.5 px-3 py-4 border-gray-100 border-t">
          {/* <button className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2.5 rounded-lg w-full text-gray-500 hover:text-gray-800 text-sm text-left transition-colors">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </button> */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 hover:bg-red-50 px-3 py-2.5 rounded-lg w-full text-gray-500 hover:text-red-600 text-sm text-left transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* User info */}
        <div className="bg-gray-50 px-4 py-3 border-gray-100 border-t">
          <p className="font-semibold text-gray-800 text-xs truncate">
            {user?.name}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {user?.department}
          </p>
        </div>
      </aside>

      {/* Right side: topbar + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Desktop top navbar */}
        <header className="hidden md:flex justify-between items-center gap-4 bg-white px-6 py-3 border-gray-100 border-b shrink-0">
          {/* Search bar */}
          <GlobalSearch />

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />

            <button
              onClick={() => navigate("/settings")}
              className="hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-gray-100 border-l">
              <div className="text-right">
                <p className="font-semibold text-gray-800 text-xs leading-none">
                  {user?.name}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wide">
                  {user?.role || user?.department}
                </p>
              </div>
              <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8 overflow-hidden shrink-0">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile top navbar */}
        <header className="md:hidden flex justify-between items-center bg-white px-4 py-3 border-gray-100 border-b shrink-0">
          <div>
            <p className="font-bold text-primary text-base leading-none">
              Attendly
            </p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">
              Staff Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <div className="flex justify-center items-center bg-gray-100 rounded-full w-8 h-8 overflow-hidden">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden right-0 bottom-0 left-0 z-50 fixed flex bg-white border-gray-100 border-t">
          {bottomTabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col flex-1 items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-gray-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg ${isActive ? "bg-primary-light" : ""}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default StaffLayout;
