/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Coffee, CalendarDays } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import StaffLayout from "../../pages/staff/StaffLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import {
  clockInApi,
  clockOutApi,
  getMyAttendanceApi,
  getTodayApi,
} from "../../api/attendance";
import {
  getLeaveBalanceApi,
  getMyCurrentDeductionApi,
  getMyLeavesApi,
} from "../../api/leaves";

// Live session timer
const useSessionTimer = (clockInTime) => {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!clockInTime) return;
    const start = new Date(clockInTime).getTime();

    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);

  return elapsed;
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: () => getTodayApi().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: deductionData } = useQuery({
    queryKey: ["current-deduction"],
    queryFn: () => getMyCurrentDeductionApi().then((r) => r.data.data),
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: [
      "my-attendance-summary",
      new Date().getMonth(),
      new Date().getFullYear(),
    ],
    queryFn: () =>
      getMyAttendanceApi({
        page: 1,
        limit: 1,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      }).then((r) => r.data.summary),
  });

  const { data: leaveBalanceData } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => getLeaveBalanceApi().then((r) => r.data.balances || []),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["staff-dashboard-activity"],
    queryFn: async () => {
      const [attendanceRes, leavesRes] = await Promise.all([
        getMyAttendanceApi({ page: 1, limit: 3 }),
        getMyLeavesApi({ page: 1, limit: 3 }),
      ]);

      const attendanceItems = (attendanceRes.data.data || []).map((item) => {
        // Use clock_in time if available, otherwise use date
        const timeReference = item.clock_in
          ? new Date(item.clock_in)
          : new Date(item.date);
        const statusDisplay =
          item.status === "on_leave" ? "Leave" : item.status;
        const titleDisplay =
          item.status === "on_leave"
            ? "On Leave"
            : `Attendance marked as ${item.status}`;

        return {
          id: `attendance-${item._id}`,
          iconBg: "bg-blue-100 text-blue-600",
          icon: <Clock />,
          title: titleDisplay,
          desc: `Clock in: ${item.clock_in ? format(new Date(item.clock_in), "hh:mm a") : "N/A"}${item.clock_out ? ` · Clock out: ${format(new Date(item.clock_out), "hh:mm a")}` : ""}`,
          time: formatDistanceToNow(timeReference, { addSuffix: true }),
          timestamp: timeReference.getTime(),
        };
      });

      const leaveItems = (leavesRes.data.leaves || []).map((item) => ({
        id: `leave-${item._id}`,
        iconBg: "bg-violet-100 text-violet-600",
        icon: <CalendarDays />,
        title: `${item.leave_type_id?.name || "Leave"} request ${item.status}`,
        desc: `${item.start_date} to ${item.end_date}`,
        time: formatDistanceToNow(new Date(item.createdAt), {
          addSuffix: true,
        }),
        timestamp: new Date(item.createdAt).getTime(),
      }));

      return [...attendanceItems, ...leaveItems]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    },
  });

  const elapsed = useSessionTimer(todayData?.clock_in);

  const { mutate: doClock, isPending: clocking } = useMutation({
    mutationFn:
      todayData?.clock_in && !todayData?.clock_out ? clockOutApi : clockInApi,
    onSuccess: () => {
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
    },
    onError: (err) => {
      setActionError(
        err.response?.data?.message || "Action failed. Try again.",
      );
    },
  });

  const hasClockedIn = !!todayData?.clock_in;
  const hasClockedOut = !!todayData?.clock_out;
  const isOnLeave = todayData?.status === "on_leave";
  const isHoliday = todayData?.status === "holiday";

  const totalLeaveCap = (leaveBalanceData || []).reduce(
    (sum, item) => sum + (item.cap_days || 0),
    0,
  );
  const leaveRemaining = (leaveBalanceData || []).reduce(
    (sum, item) => sum + (item.remaining_days || 0),
    0,
  );
  const leavePercent =
    totalLeaveCap > 0 ? Math.round((leaveRemaining / totalLeaveCap) * 100) : 0;

  const monthlyPresent = attendanceSummary?.present || 0;
  const monthlyLate = attendanceSummary?.late || 0;
  const monthlyAbsent = attendanceSummary?.absent || 0;
  const monthlyTrackedDays = monthlyPresent + monthlyLate + monthlyAbsent;
  const monthlyAttendanceRate =
    monthlyTrackedDays > 0
      ? (((monthlyPresent + monthlyLate) / monthlyTrackedDays) * 100).toFixed(1)
      : "0.0";
  const circumference = 201;
  const dashOffset = circumference - (circumference * leavePercent) / 100;

  return (
    <StaffLayout>
      {/* Content area */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-12">
        {/* Header */}
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="mb-2 font-extrabold text-gray-900 text-2xl md:text-4xl tracking-tight">
              {greeting}, {user?.name?.split(" ")[0]}.
            </h2>
            <p className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              {today}
            </p>
          </div>

          {/* Status pill */}
          {hasClockedIn && (
            <div className="flex items-center self-start sm:self-auto gap-3 bg-white shadow-sm px-5 py-3 border border-slate-100 rounded-2xl">
              <span className="bg-emerald-500 rounded-full w-3 h-3 animate-pulse shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-slate-400 text-xs uppercase tracking-tighter">
                  Today's Status
                </span>
                <span className="font-semibold text-emerald-600 text-sm">
                  {hasClockedOut
                    ? `Clocked out at ${format(new Date(todayData.clock_out), "hh:mm a")}`
                    : `Present since ${format(new Date(todayData.clock_in), "hh:mm a")}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="gap-6 grid grid-cols-12">
          {/* Clock card + stat row  */}
          <div className="flex flex-col gap-6 col-span-12 lg:col-span-8">
            {/* Clock card */}
            <section className="relative bg-linear-to-br from-primary to-[#4e52bb] shadow-xl p-8 md:p-10 rounded-4xl h-full overflow-hidden text-white">
              {/* Decorative blurs */}
              <div className="-top-20 -right-20 absolute bg-white/5 blur-3xl rounded-full w-80 h-80 pointer-events-none" />
              <div className="-bottom-20 -left-20 absolute bg-white/10 blur-2xl rounded-full w-60 h-60 pointer-events-none" />
              <div className="z-10 relative flex flex-col justify-center items-center h-full min-h-65 text-center">
                {todayLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Spinner className="border-white/30 border-t-white" />
                  </div>
                ) : isOnLeave ? (
                  <div className="py-6">
                    <p className="mb-2 font-bold text-white/60 text-sm uppercase tracking-[0.2em]">
                      Status
                    </p>
                    <p className="font-black text-4xl">On Approved Leave</p>
                    <p className="mt-3 text-white/50 text-sm">
                      Enjoy your time off. See you soon!
                    </p>
                  </div>
                ) : isHoliday ? (
                  <div className="py-6">
                    <p className="mb-2 font-bold text-white/60 text-sm uppercase tracking-[0.2em]">
                      Today
                    </p>
                    <p className="font-black text-4xl">Public Holiday</p>
                    <p className="mt-3 text-white/50 text-sm">
                      No attendance required today.
                    </p>
                  </div>
                ) : hasClockedIn && !hasClockedOut ? (
                  /* Active session */
                  <div className="py-6 w-full">
                    <p className="mb-2 font-bold text-white/70 text-sm uppercase tracking-[0.2em]">
                      Current Session
                    </p>
                    <p className="mb-8 font-black text-5xl md:text-6xl tracking-tighter">
                      {elapsed}
                    </p>
                    <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
                      <button
                        onClick={() => doClock()}
                        disabled={clocking}
                        className="flex items-center gap-3 bg-white disabled:opacity-60 shadow-2xl shadow-black/20 px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-primary text-lg md:text-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        {clocking ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-6 h-6" /> Clock Out
                          </>
                        )}
                      </button>
                      <button
                        disabled
                        title="Break tracking coming soon"
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-4 md:py-5 rounded-full font-bold text-white transition-all cursor-not-allowed"
                      >
                        <Coffee className="w-5 h-5" /> Take Break
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-8 md:mt-10 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-white/60">Shift Start</p>
                        <p className="font-bold text-lg">
                          {format(new Date(todayData.clock_in), "hh:mm a")}
                        </p>
                      </div>
                      <div className="hidden sm:block bg-white/20 w-px h-10" />
                      <div className="text-center">
                        <p className="font-medium text-white/60">Daily Goal</p>
                        <p className="font-bold text-lg">08:00 Hours</p>
                      </div>
                    </div>
                  </div>
                ) : hasClockedOut ? (
                  /* Shift complete */
                  <div className="py-6">
                    <CheckCircle2 className="mx-auto mb-3 w-12 h-12 text-emerald-400" />
                    <p className="mb-1 font-black text-2xl">Shift Complete</p>
                    <p className="text-white/50 text-sm">
                      {format(new Date(todayData.clock_in), "hh:mm a")} →{" "}
                      {format(new Date(todayData.clock_out), "hh:mm a")}
                    </p>
                    <div className="mt-3">
                      <StatusBadge status={todayData.status} />
                    </div>
                  </div>
                ) : (
                  /* Not clocked in */
                  <div className="py-6 w-full">
                    <p className="mb-6 font-bold text-white/70 text-sm uppercase tracking-[0.2em]">
                      Ready to start?
                    </p>
                    <button
                      onClick={() => doClock()}
                      disabled={clocking}
                      className="flex justify-center items-center gap-3 bg-white disabled:opacity-60 shadow-2xl shadow-black/20 mx-auto px-10 py-5 rounded-full font-black text-primary text-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {clocking ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Clock className="w-6 h-6" /> Clock In
                        </>
                      )}
                    </button>
                    <p className="mt-6 text-white/40 text-xs">
                      Shift starts at 08:00 AM · Grace period until 09:00 AM
                    </p>
                  </div>
                )}

                {actionError && (
                  <p className="mt-4 text-red-300 text-xs">{actionError}</p>
                )}
              </div>
            </section>

            {/* Stat cards row */}
            <div className="gap-6 grid grid-cols-1 sm:grid-cols-3">
              {/* Attendance */}
              <div className="bg-white shadow-sm p-6 border-emerald-500 border-l-4 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    Attendance
                  </span>
                </div>
                <p className="font-black text-gray-900 text-2xl">
                  {monthlyAttendanceRate}%
                </p>
                <p className="mt-1 font-medium text-slate-500 text-xs">
                  This month
                </p>
              </div>

              {/* Lates */}
              <div className="bg-white shadow-sm p-6 border-amber-400 border-l-4 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-amber-50 p-2 rounded-xl text-amber-600">
                    <Clock className="w-5 h-5" />
                  </span>
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    Lates (
                    {String(deductionData?.late_count ?? 0).padStart(2, "0")})
                  </span>
                </div>
                <p className="font-black text-gray-900 text-2xl">
                  {deductionData?.late_count ?? 0}
                </p>
                <p className="mt-1 font-medium text-slate-500 text-xs">
                  Total late arrivals
                </p>
              </div>

              {/* Absences */}
              <div className="bg-white shadow-sm p-6 border-red-500 border-l-4 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-red-50 p-2 rounded-xl text-red-500">
                    <CheckCircle2 className="opacity-40 w-5 h-5" />
                  </span>
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    Absences (
                    {String(deductionData?.absent_days ?? 0).padStart(2, "0")})
                  </span>
                </div>
                <p className="font-black text-gray-900 text-2xl">
                  {deductionData?.absent_days ?? 0} Days
                </p>
                <p className="mt-1 font-medium text-slate-500 text-xs">
                  {(deductionData?.absent_days ?? 0) === 0
                    ? "Perfect streak!"
                    : "This month"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity and Leave Balance  */}
          <div className="flex flex-col gap-6 col-span-12 lg:col-span-4">
            <section className="flex-1 bg-white shadow-sm p-6 md:p-8 rounded-4xl">
              {/* Recent Activity */}
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">
                  Recent Activity
                </h3>
                <button className="font-bold text-primary text-xs hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-6">
                {(recentActivity || []).map((item) => (
                  <div key={item.id} className="group flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${item.iconBg}`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-primary text-sm transition-colors">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-slate-500 text-xs leading-relaxed">
                        {item.desc}
                      </p>
                      <p className="mt-2 font-bold text-[10px] text-slate-400 uppercase tracking-tighter">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
                {!recentActivity?.length && (
                  <p className="text-slate-500 text-xs">
                    No recent activity yet.
                  </p>
                )}
              </div>

              {/* Leave Balance  */}
              <div className="bg-slate-50 mt-8 md:mt-10 p-5 md:p-6 rounded-2xl">
                <p className="mb-4 font-bold text-slate-400 text-xs uppercase tracking-widest">
                  Leave Balance
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-black text-gray-900 text-3xl">
                      {leaveRemaining}
                    </p>
                    <p className="font-medium text-slate-500 text-xs">
                      Days Remaining
                    </p>
                  </div>
                  {/* SVG Donut*/}
                  <div className="relative flex justify-center items-center w-20 h-20 shrink-0">
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 80 80"
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="text-primary"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-black text-[10px] text-primary">
                      {leavePercent}%
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
