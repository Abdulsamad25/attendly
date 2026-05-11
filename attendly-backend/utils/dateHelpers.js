/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 * All date keys in the DB are stored in this format.
 */
const getTodayKey = () => {
  const now = new Date();
  return formatDateKey(now);
};

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns an array of YYYY-MM-DD strings for every day between
 * start and end (inclusive).
 */
const getDateRange = (startStr, endStr) => {
  const dates = [];
  const current = new Date(startStr);
  const end = new Date(endStr);

  while (current <= end) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Parses a "HH:MM" string into { hours, minutes }.
 */
const parseTimeString = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

module.exports = {
  getTodayKey,
  formatDateKey,
  getDateRange,
  parseTimeString,
};