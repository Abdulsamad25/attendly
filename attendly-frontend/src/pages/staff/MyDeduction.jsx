import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Download } from 'lucide-react';
import StaffLayout from '../../pages/staff/StaffLayout';
import Spinner from '../../components/ui/Spinner';
import { getMyDeductionsApi, getMyCurrentDeductionApi } from '../../api/leaves';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MyDeductions = () => {
  const [page, setPage] = useState(1);

  const { data: currentData } = useQuery({
    queryKey: ['current-deduction'],
    queryFn: () => getMyCurrentDeductionApi().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-deductions', page],
    queryFn: () => getMyDeductionsApi({ page, limit: 12 }).then((r) => r.data),
    keepPreviousData: true,
  });

  const records    = data?.data || [];
  const pagination = data?.pagination || { pages: 1, total: 0 };
  const cur        = currentData || { absent_days: 0, absent_amount: 0, late_count: 0, late_units: 0, late_amount: 0, total_deduction: 0 };

  return (
    <StaffLayout>
      <div className="mx-auto p-6 max-w-4xl">
        <h1 className="mb-1 font-bold text-gray-900 text-2xl">My Deductions</h1>
        <p className="mb-6 text-gray-400 text-sm">
          View your automated salary adjustments based on attendance and leave policy.
        </p>

        {/* Current month breakdown */}
        <div className="gap-5 grid grid-cols-1 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2 p-6 card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()} Breakdown
                </h2>
                <p className="text-gray-400 text-xs">Current active payroll cycle</p>
              </div>
              <span className="bg-amber-100 px-2.5 py-1 rounded-full font-semibold text-amber-700 text-xs uppercase tracking-wide">
                Processing
              </span>
            </div>

            {/* Key figures */}
            <div className="gap-4 grid grid-cols-3 mb-5">
              {[
                { label: 'Absent Days',    value: cur.absent_days,     color: 'text-red-600' },
                { label: 'Late Count',     value: `${cur.late_count} Events`, color: 'text-amber-600' },
                { label: 'Total Deducted', value: `-₦${cur.total_deduction.toLocaleString()}`, color: 'text-red-600' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="mb-1 text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Breakdown rows */}
            <div className="gap-3 grid grid-cols-2">
              <div className="bg-red-50 p-4 rounded-xl">
                <p className="mb-1 text-gray-500 text-xs">Absenteeism Impact</p>
                <p className="font-bold text-red-600 text-sm">-₦{cur.absent_amount?.toLocaleString?.() ?? 0}</p>
                <p className="text-gray-400 text-xs">{cur.absent_days} absent day(s)</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="mb-1 text-gray-500 text-xs">Punctuality Fine</p>
                <p className="font-bold text-amber-600 text-sm">-₦{cur.late_amount?.toLocaleString?.() ?? 0}</p>
                <p className="text-gray-400 text-xs">{cur.late_count} late(s) · {cur.late_units} deduction unit(s)</p>
              </div>
            </div>
          </div>

          {/* Trend card */}
          <div className="flex flex-col justify-between bg-primary-dark p-6 text-white card">
            <div>
              <p className="mb-1 text-white/50 text-xs uppercase tracking-wide">Deduction Trend</p>
              <p className="text-white/70 text-xs">Compared to last month</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <span className="font-bold text-3xl">
                  ₦{cur.total_deduction.toLocaleString()}
                </span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Clock in before 09:00 AM consistently to reduce this to ₦0.
              </p>
            </div>
            <button className="hover:bg-white/10 py-2.5 border border-white/20 rounded-xl w-full font-semibold text-white/80 text-xs transition-colors">
              Review Attendance Rules
            </button>
          </div>
        </div>

        {/* History table */}
        <div className="overflow-hidden card">
          <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-b">
            <h2 className="font-semibold text-gray-800 text-sm">History & Adjustments</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs btn-secondary">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : records.length === 0 ? (
            <div className="py-10 text-gray-400 text-sm text-center">No deduction history yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-gray-100 border-b">
                  {['Period', 'Absent / Late', 'Deduction', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold text-gray-400 text-xs text-left uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 border-gray-50 border-b transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col justify-center items-center bg-primary-light rounded-lg w-10 h-10 shrink-0">
                          <span className="font-bold text-[10px] text-primary uppercase">{MONTH_NAMES[r.month - 1]}</span>
                          <span className="text-[10px] text-primary/70">{r.year}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{MONTH_NAMES[r.month - 1]} {r.year}</p>
                          <p className="text-gray-400 text-xs">Completed & Disbursed</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {r.absent_days} Abs / {r.late_count} Late
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-sm ${r.total_deduction > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {r.total_deduction > 0 ? `-₦${r.total_deduction.toLocaleString()}` : '₦0.00'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-emerald-100 px-2.5 py-0.5 rounded-full font-semibold text-emerald-700 text-xs">
                        Disbursed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-between items-center px-5 py-4 border-gray-100 border-t">
              <p className="text-gray-400 text-xs">Page {page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="disabled:opacity-40 px-3 py-1.5 text-xs btn-secondary">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  className="disabled:opacity-40 px-3 py-1.5 text-xs btn-secondary">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

export default MyDeductions;