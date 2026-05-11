/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import GlobalSearch from "../ui/GlobalSearch";
import NotificationDropdown from "../ui/NotificationDropdown";
import { profileApi } from "../../api/admin";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        const res = await profileApi.get();
        if (res.data && res.data.profilePicture) {
          setProfilePic(res.data.profilePicture);
        }
      } catch (err) {}
    };
    fetchProfilePic();
  }, []);

  const navigationItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Staff Directory", href: "/admin/staff", icon: Users },
    { label: "Pending Approvals", href: "/admin/pending-approvals", icon: UserCheck },
    { label: "Attendance", href: "/admin/attendance", icon: Clock },
    { label: "Leave Queue", href: "/admin/leaves", icon: CheckSquare },
    { label: "Leave Calendar", href: "/admin/calendar", icon: Calendar },
    { label: "Payroll", href: "/admin/payroll", icon: DollarSign },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex bg-gray-50 h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed flex flex-col md:static inset-y-0 left-0 z-50 w-64 h-screen bg-linear-to-b from-slate-900 to-slate-800 text-white shadow-lg transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-5 shrink-0">
          <h1 className="flex items-center gap-2 font-bold">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <span className="text-lg">Attendly</span>
          </h1>
          <p className="mt-1 text-slate-400 text-xs">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6 shrink-0">
          <div className="bg-slate-800/60 mb-3 px-4 py-2.5 rounded-lg">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Logged in as</p>
            <p className="mt-0.5 font-semibold text-sm truncate">{user?.name}</p>
          </div>
          <button
            onClick={() => { logout(); setSidebarOpen(false); }}
            className="flex items-center gap-2 hover:bg-red-600 px-4 py-2.5 rounded-lg w-full text-slate-300 hover:text-white text-sm transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden top-4 left-4 z-40 fixed bg-white shadow-lg p-2 rounded-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center bg-white px-6 md:px-8 py-3 border-gray-200 border-b min-h-18">
          <div className="hidden md:block flex-1 max-w-xl">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4 ml-auto pl-4">
            <NotificationDropdown />
            <div className="hidden sm:flex items-center gap-3 pl-4 border-gray-200 border-l">
              <div className="text-right">
                <p className="font-semibold text-gray-900 leading-none">{user?.name}</p>
                <p className="mt-1 text-[10px] text-gray-500 uppercase">{user?.role}</p>
              </div>
              <div className="flex justify-center items-center bg-indigo-100 rounded-full w-10 h-10 overflow-hidden shrink-0">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-indigo-600 text-lg">{user?.name?.charAt(0) || "A"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden z-40 fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;