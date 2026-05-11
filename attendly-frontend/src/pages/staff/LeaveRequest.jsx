/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import StaffLayout from '../../pages/staff/StaffLayout';
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import {
  createLeaveApi,
  getLeaveTypesApi,
  getLeaveBalanceApi,
  getMyLeavesApi,
} from "../../api/leaves";
import { format } from "date-fns";

const leaveSchema = z
  .object({
    leave_type_id: z.string().min(1, "Select a leave type."),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    reason: z.string().optional(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

const LeaveRequest = () => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: typesData } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => getLeaveTypesApi().then((r) => r.data.types),
  });

  const { data: balanceData } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => getLeaveBalanceApi().then((r) => r.data.balances),
  });

  const { data: recentData } = useQuery({
    queryKey: ["my-leaves", 1],
  
    queryFn: () => getMyLeavesApi({ page: 1, limit: 3 }).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(leaveSchema) });

  const selectedTypeId = watch("leave_type_id");
  const selectedBalance = balanceData?.find(
    (b) => b.leave_type._id === selectedTypeId,
  );

  const { mutate: submitLeave, isPending } = useMutation({
    mutationFn: createLeaveApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err) => {
      setServerError(
        err.response?.data?.message || "Failed to submit. Try again.",
      );
    },
  });

  const onSubmit = (data) => {
    setServerError("");
    submitLeave(data);
  };

  const today = format(new Date(), "yyyy-MM-dd");

  const recentLeaves = recentData?.leaves || [];

  return (
    <StaffLayout>
      <div className="mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-primary-light px-2.5 py-1 rounded-full font-semibold text-primary text-xs uppercase tracking-wide">
            Process
          </span>
        </div>
        <h1 className="mb-1 font-bold text-gray-900 text-2xl">Leave Request</h1>
        <p className="mb-6 text-gray-400 text-sm">
          Submit your time-off request. Your manager will review and respond
          shortly.
        </p>

        <div className="gap-5 grid grid-cols-1 lg:grid-cols-3">
          {/*  Form  */}
          <div className="lg:col-span-2 p-6 card">
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 mb-5 px-4 py-3 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Leave request submitted successfully!
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                label="Leave Type"
                error={errors.leave_type_id?.message}
                required
              >
                <select {...register("leave_type_id")} className="input-base">
                  <option value="">Select leave type</option>
                  {typesData?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="gap-4 grid grid-cols-2">
                <FormField
                  label="Start Date"
                  error={errors.start_date?.message}
                  required
                >
                  <input
                    {...register("start_date")}
                    type="date"
                    min={today}
                    className="input-base"
                  />
                </FormField>
                <FormField
                  label="End Date"
                  error={errors.end_date?.message}
                  required
                >
                  <input
                    {...register("end_date")}
                    type="date"
                    min={today}
                    className="input-base"
                  />
                </FormField>
              </div>

              <FormField
                label="Reason for Leave"
                error={errors.reason?.message}
              >
                <textarea
                  {...register("reason")}
                  rows={4}
                  placeholder="Briefly describe the purpose of your request..."
                  className="resize-none input-base"
                />
              </FormField>

              {serverError && (
                <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg text-red-600 text-sm">
                  {serverError}
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="flex items-center gap-1 text-gray-400 text-xs">
                  <CalendarDays className="w-3.5 h-3.5" /> Estimated: 5 business
                  days to review
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 px-6 py-2.5 rounded-lg font-semibold text-white text-sm transition-colors"
                >
                  {isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      Submit Request <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/*  Right panel  */}
          <div className="flex flex-col gap-4">
            {/* Leave balance for selected type */}
            {selectedBalance && (
              <div className="bg-primary-dark p-5 text-white card">
                <p className="mb-1 text-white/50 text-xs uppercase tracking-wide">
                  Leave Balance
                </p>
                <p className="mb-0.5 font-bold text-4xl">
                  {selectedBalance.remaining_days}
                </p>
                <p className="text-white/50 text-xs">
                  Days remaining this year
                </p>
              </div>
            )}

            {/* Policy highlights */}
            <div className="p-5 card">
              <p className="mb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Policy Highlights
              </p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Annual leave requires 5 days advance notice.",
                  "Sick leave can be filed same day.",
                  "Emergency leave requires no notice.",
                  "Approved days excluded from deductions.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-gray-500 text-xs"
                  >
                    <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent requests — uses recentLeaves from backend */}
            {recentLeaves.length > 0 && (
              <div className="p-5 card">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Recent Requests
                  </p>
                  <Link
                    to="/my-leaves"
                    className="text-primary text-xs hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {recentLeaves.map((l) => (
                    <div
                      key={l._id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-xs">
                          {l.leave_type_id?.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {l.start_date} → {l.end_date}
                        </p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default LeaveRequest;