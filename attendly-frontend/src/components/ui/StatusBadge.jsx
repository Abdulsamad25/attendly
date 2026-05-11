const config = {
  present:  { label: 'Present',  classes: 'bg-emerald-100 text-emerald-700' },
  late:     { label: 'Late',     classes: 'bg-amber-100 text-amber-700' },
  absent:   { label: 'Absent',   classes: 'bg-red-100 text-red-700' },
  on_leave: { label: 'On Leave', classes: 'bg-violet-100 text-violet-700' },
  holiday:  { label: 'Holiday',  classes: 'bg-sky-100 text-sky-700' },
  // Leave statuses
  pending:  { label: 'Pending',  classes: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', classes: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },
  cancelled:{ label: 'Cancelled',classes: 'bg-gray-100 text-gray-500' },
  // Staff account statuses
  active:   { label: 'Active',   classes: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactive', classes: 'bg-gray-100 text-gray-500' },
};

const StatusBadge = ({ status }) => {
  const { label, classes } = config[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`badge ${classes}`}>
      {label}
    </span>
  );
};

export default StatusBadge;