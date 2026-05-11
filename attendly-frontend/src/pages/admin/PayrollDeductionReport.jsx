/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Download, FileText, TrendingDown } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import { staffApi } from "../../api/admin";

const PayrollDeductionReport = () => {
  const [month, setMonth] = useState("Current Month");
  const [staffPayroll, setStaffPayroll] = useState([]);
  const [stats, setStats] = useState([
    {
      label: "TOTAL PAYOUT",
      value: "$0",
      change: "-0% vs last month",
      type: "neutral",
    },
    {
      label: "TOTAL DEDUCTIONS",
      value: "$0",
      change: "-0% from absences",
      type: "positive",
    },
    {
      label: "AVG. ABSENT DAYS",
      value: "0",
      description: "Staff attendance stable",
    },
    { label: "TOTAL LATE LOGS", value: "0", description: "Requires review" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all staff with attendance and deduction data
      const staffResponse = await staffApi.getAll();
      const staffList = staffResponse.data || [];

      // Calculate payroll data for each staff
      const payrollData = staffList.map((staff) => ({
        _id: staff._id,
        name: staff.name,
        role: staff.role || "Staff",
        baseSalary: staff.salary || 5000,
        absentDays: "0 Days", // This would come from attendance API
        lateCount: "0 Late", // This would come from attendance API
        deduction: 0,
        netPayout: staff.salary || 5000,
      }));

      setStaffPayroll(payrollData);

      // Calculate stats
      const totalBase = payrollData.reduce((sum, r) => sum + r.baseSalary, 0);
      const totalDeductions = payrollData.reduce(
        (sum, r) => sum + r.deduction,
        0,
      );
      const totalPayout = totalBase - totalDeductions;

      setStats([
        {
          label: "TOTAL PAYOUT",
          value: `$${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          change: "-0% vs last month",
          type: "neutral",
        },
        {
          label: "TOTAL DEDUCTIONS",
          value: `$${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          change: "-0% from absences",
          type: "positive",
        },
        {
          label: "AVG. ABSENT DAYS",
          value: "0",
          description: "Staff attendance stable",
        },
        {
          label: "TOTAL LATE LOGS",
          value: "0",
          description: "Requires review",
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to fetch payroll data");
      console.error("Payroll fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchPayrollData}
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
              <h1 className="font-bold text-gray-900 text-3xl">
                Payroll Deductions
              </h1>
              <p className="mt-1 text-gray-600">Monthly summary for {month}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors">
                <FileText size={18} />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium text-white transition-colors">
                <Download size={18} />
                <span className="hidden sm:inline">PDF Export</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-4 border border-gray-200 rounded-lg"
              >
                <p className="font-semibold text-gray-600 text-xs tracking-wider">
                  {stat.label}
                </p>
                <p className="mt-2 font-bold text-gray-900 text-3xl">
                  {stat.value}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    stat.type === "positive"
                      ? "text-emerald-600"
                      : stat.type === "negative"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  {stat.change || stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Staff Payroll Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6 border-gray-200 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">
                {month} Staff Summary
              </h2>
            </div>

            {staffPayroll.length === 0 ? (
              <div className="flex justify-center items-center p-12 text-center">
                <div>
                  <p className="font-medium text-gray-600 text-lg">
                    No staff records found
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-gray-200 border-b">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          STAFF NAME
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          BASE SALARY
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          ABSENT DAYS
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          LATE COUNT
                        </th>
                        <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          DEDUCTION
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 font-semibold text-gray-700 text-sm text-left">
                          NET PAYOUT
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPayroll.map((record, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 border-gray-200 border-b transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {record.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {record.role}
                              </p>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 font-medium text-gray-900">
                            $
                            {typeof record.baseSalary === "number"
                              ? record.baseSalary.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })
                              : record.baseSalary}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4">
                            <span
                              className={`text-sm ${record.absentDays !== "0 Days" ? "text-red-600" : "text-emerald-600"}`}
                            >
                              {record.absentDays}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4">
                            <span
                              className={`text-sm ${record.lateCount !== "0 Late" ? "text-amber-600" : "text-emerald-600"}`}
                            >
                              {record.lateCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-red-600">
                            -$
                            {Math.abs(record.deduction).toLocaleString(
                              "en-US",
                              { minimumFractionDigits: 2 },
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 font-bold text-gray-900">
                            $
                            {record.netPayout.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Page Totals */}
                <div className="bg-gray-50 px-6 py-4 border-gray-200 border-t">
                  <div className="gap-4 grid grid-cols-3 md:grid-cols-6 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">TOTAL BASE</p>
                      <p className="font-semibold text-gray-900">
                        $
                        {staffPayroll
                          .reduce((sum, r) => sum + r.baseSalary, 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-gray-500 text-xs">ABSENT DAYS</p>
                      <p className="font-semibold text-red-600">0 Days</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-gray-500 text-xs">LATE LOGS</p>
                      <p className="font-semibold text-amber-600">0 Total</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">DEDUCTIONS</p>
                      <p className="font-semibold text-red-600">
                        -$
                        {staffPayroll
                          .reduce((sum, r) => sum + Math.abs(r.deduction), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-500 text-xs">TOTAL PAYOUT</p>
                      <p className="font-bold text-gray-900">
                        $
                        {staffPayroll
                          .reduce((sum, r) => sum + r.netPayout, 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Pagination */}
                <div className="flex justify-between items-center bg-white px-6 py-4 border-gray-200 border-t text-sm">
                  <p className="text-gray-600">
                    Showing 1–{staffPayroll.length} of {staffPayroll.length}{" "}
                    staff members
                  </p>
                  <div className="flex gap-2">
                    <button className="hover:bg-gray-50 px-3 py-1 border border-gray-300 rounded">
                      Previous
                    </button>
                    <button className="bg-indigo-600 px-3 py-1 rounded text-white">
                      1
                    </button>
                    <button className="hover:bg-gray-50 px-3 py-1 border border-gray-300 rounded">
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollDeductionReport;
