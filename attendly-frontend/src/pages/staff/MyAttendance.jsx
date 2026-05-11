import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Filter, Download } from "lucide-react";
import StaffLayout from "../../pages/staff/StaffLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { getMyAttendanceApi } from "../../api/attendance";

const LIMIT = 10;

const MyAttendance = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", page],
    queryFn: () =>
      getMyAttendanceApi({ page, limit: LIMIT }).then((r) => r.data),
    keepPreviousData: true,
  });

  const records = data?.data || [];
  const summary = data?.summary || { present: 0, late: 0, absent: 0 };
  const pagination = data?.pagination || { pages: 1 };

  const formatTime = (val) =>
    val ? format(new Date(val), "hh:mm a") : "--:--";
  const formatHours = (inn, out) => {
    if (!inn || !out) return "--";
    const mins = Math.round((new Date(out) - new Date(inn)) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <StaffLayout>
      <div className="mx-auto p-6 max-w-4xl">
        <h1 className="mb-1 font-bold text-gray-900 text-2xl">My Attendance</h1>
        <p className="mb-6 text-gray-400 text-sm">
          Tracking your professional presence for{" "}
          <span className="font-semibold text-primary">
            {format(new Date(), "MMMM yyyy")}
          </span>
        </p>

        {/* Summary stat cards */}
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-4 mb-6">
          {[
            {
              label: "Present Days",
              value: summary.present,
              accent: "border-emerald-400",
              text: "text-emerald-600",
            },
            {
              label: "Late Arrivals",
              value: summary.late,
              accent: "border-amber-400",
              text: "text-amber-600",
            },
            {
              label: "Absences",
              value: summary.absent,
              accent: "border-red-400",
              text: "text-red-600",
            },
          ].map(({ label, value, accent, text }) => (
            <div key={label} className={`card p-4 border-t-4 ${accent}`}>
              <p className="mb-1 text-gray-400 text-xs uppercase tracking-wide">
                {label}
              </p>
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Records table */}
        <div className="overflow-hidden card">
          <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">
              Daily Records
            </h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs btn-secondary">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs btn-secondary">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-gray-400 text-sm text-center">
              No attendance records yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-gray-100 border-b">
                  {[
                    "Date",
                    "Status",
                    "Clock In",
                    "Clock Out",
                    "Work Hours",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-semibold text-gray-400 text-xs text-left uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-gray-50 border-gray-50 border-b transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {format(new Date(r.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {format(new Date(r.date), "EEEE")}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td
                      className={`px-5 py-4 font-medium ${r.status === "late" ? "text-amber-600" : "text-gray-700"}`}
                    >
                      {formatTime(r.clock_in)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <div>
                        <p>{formatTime(r.clock_out)}</p>
                        {r.auto_clocked_out && (
                          <p className="font-medium text-orange-600 text-xs">
                            Auto clocked out at 5:00 PM
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatHours(r.clock_in, r.clock_out)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-t">
              <p className="text-gray-400 text-xs">
                Page {page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="disabled:opacity-40 px-3 py-1.5 text-xs btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="disabled:opacity-40 px-3 py-1.5 text-xs btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

export default MyAttendance;
