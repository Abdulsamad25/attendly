import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../lib/AuthContext";
import { attendanceApi, leaveApi } from "../../api/admin";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarPlus,
  UserPlus,
  CalendarX,
} from "lucide-react";

const AVATAR_COLOURS = [
  "bg-indigo-600",
  "bg-violet-600",
  "bg-blue-600",
  "bg-slate-500",
];

const AdminHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPresent: 0,
    lateArrivals: 0,
    totalAbsent: 0,
    totalStaff: 0,
  });
  const [clockedInStaff, setClockedInStaff] = useState([]);
  const [leaveQueueCount, setLeaveQueueCount] = useState(0);
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [activeChart, setActiveChart] = useState("Week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData(true);

    const intervalId = setInterval(() => {
      fetchDashboardData(false);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // Fetch today's attendance summary
      const attendanceRes = await attendanceApi.getTodaySummary();
      console.log("Attendance Summary Response:", attendanceRes);
      const today = attendanceRes.data || {};
      console.log("Today Data:", today);

      // Fetch recent attendance (for clocked-in staff list)
      const recentRes = await attendanceApi.getRecent(10);
      console.log("Recent Attendance Response:", recentRes);
      const recentRecords = recentRes.data || [];

      // Fetch pending leaves
      const leaveRes = await leaveApi.getPending();
      console.log("Pending Leaves Response:", leaveRes);
      const pendingLeaves = leaveRes.leaves || [];

      // Fetch weekly trend data
      let weeklyData = [];
      let monthlyData = [];
      try {
        const weeklyRes = await attendanceApi.getWeekly();
        console.log("Weekly Response:", weeklyRes);
        const raw = weeklyRes.data || [];
        weeklyData = raw.map((item) => ({
          day: (item.day || item.date || "")
            .toString()
            .slice(0, 3)
            .toUpperCase(),
          value:
            item.value !== undefined
              ? item.value
              : item.total > 0
                ? Math.round((item.present / item.total) * 100)
                : 0,
        }));
      } catch (err) {
        console.log("Weekly data error:", err);
        weeklyData = [];
      }

      // Fetch monthly trend data (if available, otherwise use weekly as fallback)
      try {
        const monthlyRes = await attendanceApi.getMonthly?.();
        if (monthlyRes) {
          console.log("Monthly Response:", monthlyRes);
          const raw = monthlyRes.data || [];
          monthlyData = raw.map((item) => ({
            day: item.day || item.date || "",
            value:
              item.value !== undefined
                ? item.value
                : item.total > 0
                  ? Math.round((item.present / item.total) * 100)
                  : 0,
          }));
        }
      } catch (err) {
        console.log("Monthly data error (using weekly as fallback):", err);
        monthlyData = weeklyData; // Fallback to weekly data
      }

      // Map clocked-in staff from recent records
      const todayStaff = recentRecords.slice(0, 4).map((record) => ({
        id: record._id,
        name: record.user_id?.name || "Unknown",
        position: record.user_id?.department || "Staff",
        location:
          record.user_id?.location ||
          (record.status === "present" ? "Headquarters" : "Remote"),
        clockInTime: record.clock_in
          ? new Date(record.clock_in).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : record.createdAt
            ? new Date(record.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--",
        status: record.status === "present" ? "online" : "offline",
        expected: record.expected_time
          ? new Date(record.expected_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      }));

      setStats({
        totalPresent: today.present || 0,
        lateArrivals: today.late || 0,
        totalAbsent: today.absent || 0,
        totalStaff: today.totalStaff || 0,
      });

      console.log("Final Stats:", {
        totalPresent: today.present,
        lateArrivals: today.late,
        totalAbsent: today.absent,
        totalStaff: today.totalStaff,
      });

      setClockedInStaff(todayStaff);
      setLeaveQueueCount(pendingLeaves.length);
      setWeeklyChart(weeklyData);
      setMonthlyChart(monthlyData);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  // Calculate percentages - attendance includes both present AND late arrivals
  const totalAttended = stats.totalPresent + stats.lateArrivals;
  const attendancePercentage =
    stats.totalStaff > 0
      ? Math.round((totalAttended / stats.totalStaff) * 100)
      : 0;

  const latePercentage =
    stats.totalStaff > 0
      ? Math.round((stats.lateArrivals / stats.totalStaff) * 100)
      : 0;

  const absentPercentage =
    stats.totalStaff > 0
      ? Math.round((stats.totalAbsent / stats.totalStaff) * 100)
      : 0;

  return (
    <div className="space-y-6 bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Error */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Greeting + Actions */}
      <div className="flex sm:flex-row flex-col justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-extrabold text-gray-900 text-xl md:text-3xl leading-tight tracking-tight">
            Good morning, {user?.name?.split(" ")[0] ?? "Admin"}.
          </h1>
          <p className="mt-1 max-w-md text-gray-500 text-sm sm:text-base">
            Everything is running smoothly today.{" "}
            <span className="font-semibold text-gray-700">
              {attendancePercentage}%
            </span>{" "}
            of your team is currently clocked in.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/admin/holidays")}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 shadow-sm p-2 border border-gray-200 rounded-xl font-semibold text-gray-800 text-xs md:text-sm active:scale-95 transition-all"
          >
            <CalendarPlus className="size-5 md:size-5" />
            Add Holiday
          </button>
          <button
            onClick={() => navigate("/admin/staff")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-md p-2 border border-gray-200 rounded-xl font-semibold text-white text-sm active:scale-95 transition-all"
          >
            <UserPlus className="size-3 md:size-5" />
            Create Staff
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="gap-5 grid grid-cols-1 sm:grid-cols-3">
        {/* Present */}
        <div className="bg-white shadow-sm p-6 border-green-500 border-l-4 rounded-2xl">
          <div className="flex justify-between items-start mb-5">
            <div className="bg-green-100 p-2.5 rounded-xl">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
          </div>
          <p className="mb-1 font-bold text-[11px] text-gray-400 uppercase tracking-widest">
            Total Staff Present
          </p>
          <h2 className="mb-4 font-black text-gray-900 text-2xl md:text-5xl">
            {String(stats.totalPresent + stats.lateArrivals).padStart(2, "0")}
          </h2>
          <div className="bg-gray-100 rounded-full w-full h-1.5 overflow-hidden">
            <div
              className="bg-green-500 rounded-full h-full transition-all duration-700"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>
        </div>

        {/* Late */}
        <div className="bg-white shadow-sm p-6 border-amber-400 border-l-4 rounded-2xl">
          <div className="flex justify-between items-start mb-5">
            <div className="bg-amber-100 p-2.5 rounded-xl">
              <Clock size={20} className="text-amber-500" />
            </div>
          </div>
          <p className="mb-1 font-bold text-[11px] text-gray-400 uppercase tracking-widest">
            Late Arrivals
          </p>
          <h2 className="mb-4 font-black text-gray-900 text-2xl md:text-5xl">
            {String(stats.lateArrivals).padStart(2, "0")}
          </h2>
          <div className="bg-gray-100 rounded-full w-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 rounded-full h-full transition-all duration-700"
              style={{ width: `${latePercentage}%` }}
            />
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white shadow-sm p-6 border-red-500 border-l-4 rounded-2xl">
          <div className="flex justify-between items-start mb-5">
            <div className="bg-red-100 p-2.5 rounded-xl">
              <XCircle size={20} className="text-red-500" />
            </div>
            <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-bold text-gray-500 text-xs">
              No change
            </span>
          </div>
          <p className="mb-1 font-bold text-[11px] text-gray-400 uppercase tracking-widest">
            Total Absent
          </p>
          <h2 className="mb-4 font-black text-gray-900 text-2xl md:text-5xl">
            {String(stats.totalAbsent).padStart(2, "0")}
          </h2>
          <div className="bg-gray-100 rounded-full w-full h-1.5 overflow-hidden">
            <div
              className="bg-red-500 rounded-full h-full transition-all duration-700"
              style={{ width: `${absentPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="items-start gap-6 grid grid-cols-1 lg:grid-cols-12">
        {/* Chart */}
        <div className="lg:col-span-8 bg-white shadow-sm p-6 sm:p-8 rounded-2xl">
          <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">
                Attendance Trends
              </h3>
              <p className="mt-0.5 text-gray-400 text-sm">
                {activeChart === "Week"
                  ? "Weekly overview of check-ins"
                  : "Monthly overview of check-ins"}
              </p>
            </div>
            <div className="flex self-start sm:self-auto bg-gray-100 p-1 rounded-xl">
              {["Week", "Month"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveChart(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeChart === tab
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="w-full" style={{ height: 240 }}>
            {(activeChart === "Week" ? weeklyChart : monthlyChart).length >
            0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeChart === "Week" ? weeklyChart : monthlyChart}
                  barCategoryGap="35%"
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fontWeight: 700,
                      fill: "#9ca3af",
                      letterSpacing: 1,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#d1d5db" }}
                    domain={[0, 100]}
                    tickCount={5}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.06)", radius: 6 }}
                    contentStyle={{
                      background: "#fff",
                      border: "none",
                      borderRadius: 10,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    formatter={(val) => [`${val}%`, "Attendance"]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={52}>
                    {(activeChart === "Week" ? weeklyChart : monthlyChart).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value >= 80 ? "#4f46e5" : "#e0e7ff"}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400 text-sm">
                  No trend data available yet
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-6 pt-6 border-gray-100 border-t">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 rounded-full w-3 h-3" />
              <span className="font-medium text-[11px] text-gray-500 md:text-sm">
                On-site Staff
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 rounded-full w-3 h-3" />
              <span className="font-medium text-[11px] text-gray-500 md:text-sm">
                Remote Staff
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Who's Clocked In */}
          <div className="bg-white shadow-sm p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900 text-sm md:text-base tracking-tight">
                Who's clocked in now
              </h3>
              <button
                onClick={() => navigate("/admin/attendance")}
                className="font-bold text-indigo-600 text-xs hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-5">
              {clockedInStaff.length > 0 ? (
                clockedInStaff.map((staff, i) => (
                  <div
                    key={staff.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base ${
                          AVATAR_COLOURS[i % AVATAR_COLOURS.length]
                        }`}
                      >
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                          staff.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {staff.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {staff.position} •{" "}
                        <span
                          className={`font-semibold ${
                            staff.location === "Remote"
                              ? "text-indigo-500"
                              : "text-amber-500"
                          }`}
                        >
                          {staff.location}
                        </span>
                      </p>
                    </div>

                    {/* Time badge */}
                    <span className="bg-gray-100 px-2 py-1 rounded-lg font-bold text-[10px] text-gray-500 uppercase tracking-wide shrink-0">
                      {staff.status === "online"
                        ? staff.clockInTime
                        : staff.expected
                          ? `Expected ${staff.expected}`
                          : staff.clockInTime}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-gray-400 text-sm text-center">
                  No staff clocked in yet
                </p>
              )}
            </div>
          </div>

          {/* Leave Queue */}
          <div className="relative bg-indigo-600 shadow-indigo-200 shadow-lg p-6 rounded-2xl overflow-hidden text-white">
            <div className="-right-5 -bottom-5 absolute opacity-10 pointer-events-none">
              <CalendarX size={100} />
            </div>
            <div className="z-10 relative">
              <p className="mb-2 font-bold text-[11px] text-indigo-200 uppercase tracking-widest">
                Leave Queue
              </p>
              <p className="mb-5 font-extrabold text-2xl">
                {leaveQueueCount} Pending Request
                {leaveQueueCount !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => navigate("/admin/leaves")}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 rounded-xl font-bold text-xs transition-all"
              >
                Review Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
