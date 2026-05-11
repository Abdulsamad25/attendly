import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MessageCircle } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { leaveApi } from "../../api/admin";

const LeaveQueue = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveApi.getPending();
      const requests = response.leaves || [];
      setLeaveRequests(requests);

      const pending = requests.filter((r) => r.status === "pending").length;
      const approved = requests.filter((r) => r.status === "approved").length;

      const allLeavesResponse = await leaveApi.getAll();
      const totalApproved =
        allLeavesResponse.leaves?.filter((r) => r.status === "approved")
          .length || 0;

      setStats({
        pending: pending,
        approved: approved,
        totalApproved: totalApproved,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch leave requests");
      console.error("Leave fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const countWorkingDays = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const handleApprove = async (id) => {
    try {
      const note = notes[id] || "";
      await leaveApi.approve(id, { admin_comment: note });
      setLeaveRequests(leaveRequests.filter((req) => req._id !== id));
      setNotes({ ...notes, [id]: "" });
      fetchLeaveRequests();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve leave: " + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const note = notes[id] || "";
      await leaveApi.reject(id, { admin_comment: note });
      setLeaveRequests(leaveRequests.filter((req) => req._id !== id));
      setNotes({ ...notes, [id]: "" });
      fetchLeaveRequests();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject leave: " + err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchLeaveRequests}
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
            <h1 className="font-bold text-gray-900 text-2xl sm:text-3xl">
              Leave Queue
            </h1>
            <p className="mt-1 text-gray-600 text-sm sm:text-base">
              Review and manage employee leave applications.
            </p>
          </div>

          {/* Stats */}
          <div className="gap-2 sm:gap-4 grid grid-cols-3">
            <div className="bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-600 text-xs sm:text-sm">
                PENDING
              </p>
              <p className="mt-1 font-bold text-gray-900 text-2xl sm:text-3xl">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-600 text-xs sm:text-sm leading-tight">
                APPROVED THIS MONTH
              </p>
              <p className="mt-1 font-bold text-emerald-600 text-2xl sm:text-3xl">
                {stats.approved}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-600 text-xs sm:text-sm leading-tight">
                APPROVED REQUESTS
              </p>
              <p className="mt-1 font-bold text-blue-600 text-2xl sm:text-3xl">
                {stats.totalApproved}
              </p>
            </div>
          </div>

          {/* Leave Requests */}
          <div className="space-y-3 sm:space-y-4">
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => {
                const avatarColors = [
                  "bg-blue-100 text-blue-600",
                  "bg-yellow-100 text-yellow-600",
                  "bg-purple-100 text-purple-600",
                  "bg-pink-100 text-pink-600",
                  "bg-green-100 text-green-600",
                ];
                const avatarBg =
                  avatarColors[
                    leaveRequests.indexOf(request) % avatarColors.length
                  ];

                return (
                  <div
                    key={request._id}
                    className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg"
                  >
                    {/* Request Header */}
                    <div className="flex flex-col gap-4">
                      {/* Top row: avatar + info + action buttons */}
                      <div className="flex justify-between items-start gap-3">
                        {/* Avatar + name/dept */}
                        <div className="flex gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 ${avatarBg} rounded-full flex items-center justify-center font-semibold shrink-0 text-sm sm:text-base`}
                          >
                            {request.user_id?.name?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {request.user_id?.name || "Unknown"}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm truncate">
                              {request.user_id?.department || "Staff"}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons — always visible, top-right */}
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-white text-xs sm:text-sm transition-colors"
                          >
                            <CheckCircle size={15} className="sm:hidden" />
                            <CheckCircle
                              size={18}
                              className="hidden sm:block"
                            />
                            <span className="hidden xs:inline sm:inline">
                              Approve
                            </span>
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-white text-xs sm:text-sm transition-colors"
                          >
                            <XCircle size={15} className="sm:hidden" />
                            <XCircle size={18} className="hidden sm:block" />
                            <span className="hidden xs:inline sm:inline">
                              Reject
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Leave meta — wraps naturally on small screens */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 pl-0 sm:pl-15">
                        <div>
                          <p className="text-gray-500 text-xs">LEAVE TYPE</p>
                          <p className="font-medium text-gray-700 text-sm">
                            {request.leave_type_id?.name || "Leave"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">DURATION</p>
                          <p className="font-medium text-gray-700 text-sm">
                            {request.start_date} — {request.end_date}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">TOTAL DAYS</p>
                          <p className="font-medium text-gray-700 text-sm">
                            {countWorkingDays(
                              request.start_date,
                              request.end_date,
                            )}{" "}
                            Days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Note Section */}
                    <div className="mt-4 pt-4 border-gray-200 border-t">
                      <label className="block mb-2 font-medium text-gray-700 text-sm">
                        Add optional note...
                      </label>
                      <textarea
                        placeholder="Your note here..."
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm"
                        rows="2"
                        value={notes[request._id] || ""}
                        onChange={(e) =>
                          setNotes({ ...notes, [request._id]: e.target.value })
                        }
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <p className="font-medium text-gray-600 text-lg">
                  No pending leave requests
                </p>
              </div>
            )}
          </div>

          {/* Capacity Insight */}
          <div className="bg-indigo-50 p-4 sm:p-6 border border-indigo-200 rounded-lg">
            <div className="flex gap-3 sm:gap-4">
              <div className="shrink-0">
                <div className="flex justify-center items-center bg-indigo-600 rounded-md w-10 sm:w-12 h-10 sm:h-12 text-white text-base sm:text-lg">
                  ℹ
                </div>
              </div>
              <div>
                <h3 className="font-medium text-indigo-900 text-base sm:text-lg">
                  Leave Status
                </h3>
                <p className="mt-1 text-indigo-700 text-sm sm:text-base">
                  You have {stats.pending} pending leave request
                  {stats.pending !== 1 ? "s" : ""} awaiting review.
                  {stats.totalApproved > 0 &&
                    ` Currently ${stats.totalApproved} staff member${stats.totalApproved !== 1 ? "s" : ""} ${stats.totalApproved === 1 ? "is" : "are"} on approved leave.`}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveQueue;
