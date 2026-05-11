import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CalendarSync,
  Trash2,
} from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { leaveApi, holidayApi } from "../../api/admin";

const COUNTRY_CODES = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  DE: "Germany",
  FR: "France",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  JP: "Japan",
  MX: "Mexico",
  ZA: "South Africa",
  SG: "Singapore",
  PH: "Philippines",
  NG: "Nigeria",
};

const LeaveCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [calendarLeaves, setCalendarLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncCountry, setSyncCountry] = useState("US");
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  // Listen for leave type updates from AdminSettings
  useEffect(() => {
    const handleStorageChange = () => {
      const updateFlag = sessionStorage.getItem("leaveTypeUpdated");
      if (updateFlag) {
        // Refetch data when AdminSettings updates leave types
        fetchCalendarData();
        // Clean up the flag
        sessionStorage.removeItem("leaveTypeUpdated");
      }
    };

    // Check on mount
    handleStorageChange();

    // Listen for storage changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all leaves and holidays
      const [calendarRes, allLeavesRes, holidaysRes] = await Promise.all([
        leaveApi.getCalendar({
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
        }),
        leaveApi.getAll({ limit: 100 }),
        holidayApi.getAll(),
      ]);

      const calendarList = calendarRes.leaves || [];
      const leavesList = allLeavesRes.leaves || [];
      const holidaysList = holidaysRes.holidays || [];

      setCalendarLeaves(calendarList);
      setLeaves(leavesList);
      setHolidays(holidaysList);

      // Get upcoming leaves (next 7 days from now)
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingDates = leavesList
        .filter((leave) => {
          const leaveStart = new Date(leave.start_date);
          return (
            leaveStart >= now &&
            leaveStart <= weekFromNow &&
            leave.status === "approved"
          );
        })
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 3);

      setUpcomingLeaves(upcomingDates);
    } catch (err) {
      setError(err.message || "Failed to fetch calendar data");
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleSyncHolidays = async () => {
    if (!syncCountry || !syncYear) {
      setSyncMessage("Please select country and year");
      return;
    }

    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await holidayApi.syncHolidays({
        country_code: syncCountry,
        year: syncYear,
      });
      setSyncMessage(`✅ ${response.message}`);
      // Immediately refetch and close modal
      await fetchCalendarData();
      setSyncModalOpen(false);
    } catch (err) {
      setSyncMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Delete this public holiday?")) return;
    try {
      await holidayApi.delete(id);
      // Refetch all holidays to keep sidebar in sync
      const response = await holidayApi.getAll();
      setHolidays(response.holidays || []);
    } catch (err) {
      alert("Failed to delete holiday: " + err.message);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Build leaveData from API responses
  const leaveData = {};

  // Add holidays
  holidays.forEach((holiday) => {
    const date = new Date(holiday.date);
    if (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    ) {
      const day = date.getDate();
      if (!leaveData[day]) leaveData[day] = [];
      leaveData[day].push({
        type: "holiday",
        label: holiday.name || "Public Holiday",
      });
    }
  });

  // Add leaves
  calendarLeaves.forEach((leave) => {
    const fromDate = new Date(leave.start_date);
    const toDate = new Date(leave.end_date);
    const fullName = leave.user_id?.name || "Staff";
    const nameParts = fullName.trim().split(" ");
    const shortName =
      nameParts.length > 1
        ? `${nameParts[0].charAt(0)}. ${nameParts[nameParts.length - 1]}`
        : fullName;

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      if (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      ) {
        const day = d.getDate();
        // Skip weekend days from showing as "on leave" unless you want them - wait, calendar dates don't technically exclude them visually usually, but let's keep it simple.
        if (!leaveData[day]) leaveData[day] = [];
        leaveData[day].push({
          type: "leave",
          label: shortName,
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchCalendarData}
            className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-bold text-gray-900 text-xl md:text-3xl">
                Leave Calendar
              </h1>
              <p className="mt-1 text-gray-600 text-sm">{`${new Set(calendarLeaves.map((l) => l.user_id?._id)).size} staff members on leave this month • ${holidays.length} public holidays synced`}</p>
            </div>
            <button
              onClick={() => setSyncModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium text-white text-sm transition-colors"
            >
              <CalendarSync size={18} />
              <span className="hidden sm:inline">Sync Holidays</span>
            </button>
          </div>

          {/* Calendar */}
          <div className="gap-6 grid grid-cols-1 lg:grid-cols-4">
            {/* Main Calendar */}
            <div className="lg:col-span-3 bg-white p-6 border border-gray-200 rounded-lg">
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-gray-900 text-sm md:text-xl">
                  {monthName}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleToday}
                    className="hover:bg-gray-50 px-3 py-1 border border-gray-300 rounded text-sm transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-gray-50">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (day) => (
                      <div
                        key={day}
                        className="px-2 py-3 border-gray-200 border-r last:border-r-0 font-semibold text-gray-600 text-sm text-center"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7">
                  {days.map((day, idx) => {
                    const dayEvents = day ? leaveData[day] || [] : [];
                    return (
                      <div
                        key={idx}
                        className={`aspect-square overflow-hidden p-2 border-r border-b border-gray-200 last:border-r-0 flex flex-col items-start justify-start ${
                          !day ? "bg-gray-50" : ""
                        }`}
                      >
                        {day && (
                          <>
                            <span className="mb-1 font-semibold text-gray-900 text-sm">
                              {day}
                            </span>
                            <div className="flex flex-col gap-1 w-full overflow-y-auto custom-scrollbar">
                              {dayEvents.map((event, i) => (
                                <div
                                  key={i}
                                  className={`text-xs w-full px-1 py-0.5 rounded truncate ${
                                    event.type === "holiday"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-violet-100 text-violet-700"
                                  }`}
                                  title={event.label}
                                >
                                  {event.label}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="bg-violet-100 border border-violet-300 rounded w-4 h-4"></div>
                  <span className="text-gray-600 text-sm">
                    On Leave (Staff)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 border border-blue-300 rounded w-4 h-4"></div>
                  <span className="text-gray-600 text-sm">Public Holiday</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Leaves */}
              <div className="bg-white p-6 border border-gray-200 rounded-lg">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Upcoming Leaves
                </h3>
                <div className="space-y-3">
                  {upcomingLeaves.length > 0 ? (
                    upcomingLeaves.map((leave, idx) => (
                      <div
                        key={idx}
                        className="pb-3 border-gray-100 last:border-0 border-b"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {leave.user_id?.name || "Staff"}
                        </p>
                        <p className="mt-1 text-gray-600 text-xs">
                          {leave.leave_type_id?.name || "Leave"} •{" "}
                          {leave.start_date} - {leave.end_date}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${
                            leave.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : leave.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {leave.status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No upcoming leaves</p>
                  )}
                </div>
              </div>

              {/* Weekly Outlook */}
              <div className="bg-indigo-600 p-6 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={28} />
                  <h3 className="font-semibold">WEEKLY OUTLOOK</h3>
                </div>
                <p className="font-bold text-xl md:text-3xl">
                  {
                    leaves.filter((l) => {
                      const fromDate = new Date(l.start_date);
                      const toDate = new Date(l.end_date);
                      const now = new Date();
                      return (
                        l.status === "approved" &&
                        fromDate <= now &&
                        toDate >= now
                      );
                    }).length
                  }{" "}
                  Staff Out
                </p>
                <p className="mt-2 text-indigo-100 text-sm">
                  {upcomingLeaves.length} upcoming approved leave request
                  {upcomingLeaves.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Public Holidays */}
              <div className="bg-white p-6 border border-gray-200 rounded-lg">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Public Holidays ({holidays.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {holidays.length > 0 ? (
                    holidays
                      .filter((h) => {
                        const hDate = new Date(h.date);
                        return (
                          hDate.getMonth() === currentMonth.getMonth() &&
                          hDate.getFullYear() === currentMonth.getFullYear()
                        );
                      })
                      .map((holiday) => (
                        <div
                          key={holiday._id}
                          className="flex justify-between items-start pb-3 border-gray-100 last:border-0 border-b"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {holiday.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(holiday.date).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteHoliday(holiday._id)}
                            className="hover:bg-red-50 p-1 rounded transition-colors"
                            title="Delete holiday"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No holidays this month
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Modal */}
          {syncModalOpen && (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/30 backdrop-blur-md">
              <div className="bg-white/80 shadow-2xl backdrop-blur-lg mx-4 p-6 border border-white/20 rounded-xl w-full max-w-sm">
                <h2 className="mb-4 font-bold text-gray-900 text-xl">
                  Sync Real Public Holidays
                </h2>
                <p className="mb-4 text-gray-600 text-sm">
                  Select a country and year to fetch and sync real public
                  holidays to your calendar.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                      Country
                    </label>
                    <select
                      value={syncCountry}
                      onChange={(e) => setSyncCountry(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                    >
                      {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name} ({code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                      Year
                    </label>
                    <select
                      value={syncYear}
                      onChange={(e) => setSyncYear(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                    >
                      {[2026, 2027, 2028, 2029, 2030].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {syncMessage && (
                  <div
                    className={`p-3 rounded mb-4 text-sm ${
                      syncMessage.includes("Error")
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {syncMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSyncModalOpen(false);
                      setSyncMessage("");
                    }}
                    className="flex-1 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                    disabled={syncing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSyncHolidays}
                    className="flex flex-1 justify-center items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <Spinner />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CalendarSync size={16} />
                        Sync Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveCalendar;
