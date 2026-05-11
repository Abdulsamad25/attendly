/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Download, Filter, Plus } from "lucide-react";
import StaffLayout from "../../pages/staff/StaffLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import {
  getMyLeavesApi,
  cancelLeaveApi,
  getLeaveBalanceApi,
} from "../../api/leaves";

const LIMIT = 10;

const MyLeaves = () => {
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves", page],
    queryFn: () => getMyLeavesApi({ page, limit: LIMIT }).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => getLeaveBalanceApi().then((r) => r.data.balances),
  });

  const { mutate: cancelLeave } = useMutation({
    mutationFn: cancelLeaveApi,
    onSuccess: () => {
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
    onError: () => setCancellingId(null),
  });

  // Backend returns: { leaves: [...], total, page, pages }
  const leaves = data?.leaves || [];
  const pagination = {
    pages: data?.pages || 1,
    total: data?.total || 0,
  };

  const totalEntitlement =
    balanceData?.reduce((s, b) => s + b.cap_days, 0) || 0;
  const totalUsed = balanceData?.reduce((s, b) => s + b.used_days, 0) || 0;
  const totalPending = leaves.filter((l) => l.status === "pending").length;
  const totalRemaining = Math.max(0, totalEntitlement - totalUsed);

  return (
    <StaffLayout>
      <div className="mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="mb-1 font-bold text-gray-900 text-2xl">My Leaves</h1>
            <p className="text-gray-400 text-sm">
              Track and manage your time-off requests.
            </p>
          </div>
          <Link
            to="/leave-request"
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Request
          </Link>
        </div>

        {/* Summary stat cards */}
        <div className="gap-4 grid grid-cols-2 sm:grid-cols-4 mb-6">
          {[
            {
              label: "Total Entitlement",
              value: `${totalEntitlement} Days`,
              accent: "border-primary",
            },
            {
              label: "Days Taken",
              value: `${totalUsed} Days`,
              accent: "border-emerald-400",
            },
            {
              label: "Pending Approval",
              value: `${totalPending} Days`,
              accent: "border-amber-400",
            },
            {
              label: "Remaining Balance",
              value: `${totalRemaining} Days`,
              accent: "border-violet-400",
            },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`card p-4 border-t-4 ${accent}`}>
              <p className="mb-1 text-gray-400 text-xs uppercase tracking-wide">
                {label}
              </p>
              <p className="font-bold text-gray-900 text-xl">{value}</p>
            </div>
          ))}
        </div>

        {/* Leaves table */}
        <div className="overflow-hidden card">
          <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">
              Recent Leave History
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
          ) : leaves.length === 0 ? (
            <div className="py-12 text-gray-400 text-sm text-center">
              No leave requests yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-gray-100 border-b">
                  {["Leave Type", "Duration", "Days", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 font-semibold text-gray-400 text-xs text-left uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const isCancelling = cancellingId === l._id;
                  return (
                    <tr
                      key={l._id}
                      className="hover:bg-gray-50 border-gray-50 border-b transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {l.leave_type_id?.name}
                        </p>
                        {l.reason && (
                          <p className="max-w-40 text-gray-400 text-xs truncate">
                            {l.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs">
                        {l.start_date} → {l.end_date}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {Math.ceil(
                          (new Date(l.end_date) - new Date(l.start_date)) /
                            86400000,
                        ) + 1}{" "}
                        Days
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={l.status} />
                        {l.admin_comment && (
                          <p className="mt-1 max-w-40 text-[11px] text-gray-400 truncate">
                            "{l.admin_comment}"
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {l.status === "pending" && (
                          <button
                            onClick={() => {
                              setCancellingId(l._id);
                              cancelLeave(l._id);
                            }}
                            disabled={isCancelling}
                            className="hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 border border-red-200 rounded-lg font-medium text-red-500 hover:text-red-700 text-xs transition-colors"
                          >
                            {isCancelling ? <Spinner size="sm" /> : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-t">
              <p className="text-gray-400 text-xs">
                Showing {leaves.length} of {pagination.total} requests
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

export default MyLeaves;
