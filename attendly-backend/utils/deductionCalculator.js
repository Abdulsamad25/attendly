/**
 * Calculate the deduction amount for a single absent day.
 * @param {number} monthlySalary
 * @returns {number}
 */
const deductionPerDay = (monthlySalary) => {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  return parseFloat((monthlySalary / 30).toFixed(2));
};

/**
 * Calculate how many deduction units the current late count triggers.
 * Every complete group of 5 lates = 1 deduction unit.
 * e.g. lateCount=4  → 0 units (not yet hit 5)
 *      lateCount=5  → 1 unit
 *      lateCount=9  → 1 unit
 *      lateCount=10 → 2 units
 *
 * @param {number} lateCount  total lates so far this month
 * @returns {number}          deduction units from lates
 */
const lateDeductionUnits = (lateCount) => {
  if (!lateCount || lateCount < 5) return 0;
  return Math.floor(lateCount / 5);
};

/**
 * Calculate the full monthly deduction for a staff member.
 *
 * @param {object} params
 * @param {number} params.monthlySalary
 * @param {number} params.absentDays       - excludes approved leave & holidays
 * @param {number} params.lateCount        - total lates this month
 * @returns {object} breakdown + total
 */
const calculateMonthlyDeduction = ({ monthlySalary, absentDays, lateCount }) => {
  const dailyRate      = deductionPerDay(monthlySalary);
  const absentAmount   = parseFloat((dailyRate * (absentDays || 0)).toFixed(2));
  const lateUnits      = lateDeductionUnits(lateCount || 0);
  const lateAmount     = parseFloat((dailyRate * lateUnits).toFixed(2));
  const totalDeduction = parseFloat((absentAmount + lateAmount).toFixed(2));

  return {
    dailyRate,
    absentDays:    absentDays || 0,
    absentAmount,
    lateCount:     lateCount  || 0,
    lateUnits,
    lateAmount,
    totalDeduction,
  };
};

// /**
//  * Recalculate and return a deduction breakdown from raw attendance data.
//  * Used when refreshing a Deduction document from scratch.
//  *
//  * @param {object} params
//  * @param {number} params.monthlySalary
//  * @param {Array}  params.attendanceRecords  - array of attendance docs for the month
//  * @returns {object}
//  */
const recalculateFromAttendance = ({ monthlySalary, attendanceRecords }) => {
  let absentDays = 0;
  let lateCount  = 0;
 
  for (const record of attendanceRecords) {
    if (record.status === 'absent') absentDays += 1;
    if (record.status === 'late')   lateCount  += 1;
    // 'on_leave' and 'holiday' are excluded — correct by definition
  }
 
  const dailyRate    = parseFloat((monthlySalary / 30).toFixed(4));
  const absentAmount = parseFloat((dailyRate * absentDays).toFixed(2));
  const lateUnits    = Math.floor(lateCount / 5);
  const lateAmount   = parseFloat((dailyRate * lateUnits).toFixed(2));
  const totalDeduction = parseFloat((absentAmount + lateAmount).toFixed(2));
 
  return { dailyRate, absentDays, absentAmount, lateCount, lateUnits, lateAmount, totalDeduction };
};

module.exports = {
  deductionPerDay,
  lateDeductionUnits,
  calculateMonthlyDeduction,
  recalculateFromAttendance,
};