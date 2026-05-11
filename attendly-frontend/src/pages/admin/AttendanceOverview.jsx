import { useState, useEffect } from "react";
import { Download, Eye, MoreVertical, Calendar } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { attendanceApi } from "../../api/admin";

// Helper functions for date/time formatting
const formatDate = (dateObj) => {
  if (!dateObj) return "-";
  return new Date(dateObj).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeObj) => {
  if (!timeObj) return "-";
  return new Date(timeObj).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const AttendanceOverview = () => {
  const [dateRange, setDateRange] = useState("Today");
  const [department, setDepartment] = useState("All Departments");
  const [staffName, setStaffName] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState([
    { label: "ON PREMISES", value: "0", change: "+0% today", type: "positive" },
    { label: "ON LEAVE", value: "0", change: "Planned", type: "neutral" },
    {
      label: "LATE ARRIVALS",
      value: "0",
      change: "This period",
      type: "negative",
    },
    {
      label: "ABSENT",
      value: "0",
      change: "This period",
      type: "neutral",
    },
  ]);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params for filtering
      const filters = {};

      // Add date range filter if not "Today"
      if (dateRange !== "Today") {
        const today = new Date();
        filters.date_from = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        )
          .toISOString()
          .split("T")[0];
      }

      // Add department filter if selected
      if (department !== "All Departments") {
        filters.department = department;
      }

      // Add name filter (this is handled client-side since backend doesn't support it)

      const response = await attendanceApi.getAll(filters);
      let records = response.data || [];

      // Client-side filter by staff name if provided
      if (staffName.trim()) {
        records = records.filter((r) =>
          r.user_id?.name?.toLowerCase().includes(staffName.toLowerCase()),
        );
      }

      setAttendanceData(records);

      // Calculate stats from real data
      const present = records.filter((r) => r.status === "present").length;
      const onLeave = records.filter((r) => r.status === "on_leave").length;
      const late = records.filter((r) => r.status === "late").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const total = records.length;

      setStats([
        {
          label: "ON PREMISES",
          value: present.toString(),
          change:
            total > 0
              ? `${Math.round((present / total) * 100)}% present`
              : "No data",
          type: "positive",
        },
        {
          label: "ON LEAVE",
          value: onLeave.toString(),
          change: "Approved",
          type: "neutral",
        },
        {
          label: "LATE ARRIVALS",
          value: late.toString(),
          change: "This period",
          type: "negative",
        },
        {
          label: "ABSENT",
          value: absent.toString(),
          change: "This period",
          type: absent > 0 ? "negative" : "neutral",
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to fetch attendance data");
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchAttendanceData();
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchAttendanceData}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Header */}
          <div>
            <h1 className="font-bold text-gray-900 text-xl md:text-3xl">
              Attendance Overview
            </h1>
            <p className="mt-1 text-gray-600">
              Real-time tracking of staff presence, punctuality metrics, and
              daily logs across all departments.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-600 text-xs tracking-wider">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-bold text-gray-900 text-3xl">
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs mt-2 ${stat.type === "positive" ? "text-emerald-600" : stat.type === "negative" ? "text-red-600" : "text-gray-600"}`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      stat.type === "positive"
                        ? "bg-emerald-100 text-emerald-700"
                        : stat.type === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {stat.type === "positive"
                      ? "↑"
                      : stat.type === "negative"
                        ? "↓"
                        : "→"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  DATE RANGE
                </label>
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500">
                  <Calendar size={18} className="text-gray-400" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-700"
                  >
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>All Time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  DEPARTMENT
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                >
                  <option>All Departments</option>
                  <option>Integration</option>
                  <option>Support</option>
                  <option>Management</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700 text-sm">
                  STAFF NAME
                </label>
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>
            </div>
            <button
              onClick={handleApplyFilters}
              className="bg-gray-900 hover:bg-gray-800 mt-4 px-4 py-2 rounded-lg font-medium text-white transition-colors"
            >
              Apply Filters
            </button>
          </div>

          {/* Attendance Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-gray-200 border-b">
              <h2 className="font-semibold text-gray-900 text-sm md:text-lg">
                Daily Attendance Logs
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded transition-colors">
                  <Download size={18} className="text-gray-600" />
                  <span className="hidden sm:inline text-sm">Export</span>
                </button>
                <button className="hover:bg-gray-100 p-2 rounded transition-colors">
                  <Eye size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-gray-200 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-left">
                      STAFF MEMBER
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-left">
                      DATE
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-left">
                      CLOCK IN
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-left">
                      CLOCK OUT
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-left">
                      STATUS
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 text-xs md:text-sm text-center">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 border-gray-200 border-b transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.user_id?.name || "-"}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {record.user_id?.department || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-gray-700 text-sm">
                        {formatDate(record.date)}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-gray-700 text-sm">
                        {formatTime(record.clock_in)}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-gray-700 text-sm">
                        {formatTime(record.clock_out)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="inline-block hover:bg-gray-200 p-1 rounded transition-colors">
                          <MoreVertical size={16} className="text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-gray-200 border-t">
              <p className="text-gray-600 text-sm">
                Showing 1–{attendanceData.length} of {attendanceData.length}{" "}
                records
              </p>
              <button className="bg-indigo-600 px-3 py-1 rounded text-white text-sm">
                Review Logs
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceOverview;
