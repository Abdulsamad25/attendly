const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const PublicHoliday = require("../models/PublicHoliday");
const User = require("../models/User");
const WorkSettings = require("../models/WorkSettings");
const Notification = require("../models/Notification");
const Company = require("../models/Company");
const { upsertDeduction } = require("../controllers/deductionController");
const { formatDateKey } = require("../utils/dateHelpers");

/**
 * Check if a date is a public holiday for a company.
 */
const isPublicHoliday = async (companyId, dateKey) => {
  const holiday = await PublicHoliday.findOne({
    company_id: companyId,
    date_key: dateKey,
  });
  return !!holiday;
};

/**
 * Check if a user has an approved leave covering today.
 */
const isOnApprovedLeave = async (userId, companyId, today) => {
  const leave = await Leave.findOne({
    user_id: userId,
    company_id: companyId,
    status: "approved",
    start_date: { $lte: today },
    end_date: { $gte: today },
  });
  return !!leave;
};

/**
 * Fire an in-app notification for a user.
 */
const notify = async (userId, companyId, message, type = "warning") => {
  await Notification.create({
    user_id: userId,
    company_id: companyId,
    message,
    type,
  });
};

/**
 * CRON 1 — Auto-mark absent
 * Runs at 09:30 AM WAT, Monday–Friday.
 * For every active staff member who hasn't clocked in:
 *   - Skip if on approved leave or public holiday
 *   - Mark absent, fire notifications, trigger deduction update
 */
const startAbsentCron = () => {
  cron.schedule(
    "30 9 * * 1-5",
    async () => {
      console.log("[CRON] Auto-absent job started:", new Date().toISOString());

      try {
        const companies = await Company.find({ is_active: true }).select("_id");

        for (const company of companies) {
          const companyId = company._id;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayKey = formatDateKey(today);

          // Skip entire company if today is a public holiday
          if (await isPublicHoliday(companyId, todayKey)) {
            console.log(
              `[CRON] Public holiday for company ${companyId}, skipping`,
            );
            continue;
          }

          // Get all active staff (not admin)
          const staff = await User.find({
            company_id: companyId,
            role: "staff",
            is_active: true,
          }).select("_id name");

          for (const member of staff) {
            // Skip if already has an attendance record today
            const existing = await Attendance.findOne({
              user_id: member._id,
              company_id: companyId,
              date_key: todayKey,
            });
            if (existing) continue;

            // Skip if on approved leave
            if (await isOnApprovedLeave(member._id, companyId, today)) continue;

            // Mark absent
            await Attendance.create({
              user_id: member._id,
              company_id: companyId,
              date: today,
              date_key: todayKey,
              status: "absent",
              clock_in: null,
              clock_out: null,
            });

            // Count absences this month for warnings
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1,
            );
            const absentCount = await Attendance.countDocuments({
              user_id: member._id,
              company_id: companyId,
              status: "absent",
              date: { $gte: startOfMonth },
            });

            // 3-absence warning
            if (absentCount === 3) {
              await notify(
                member._id,
                companyId,
                `⚠️ Warning: You have been absent ${absentCount} times this month.`,
                "absence_warning",
              );
            }

            // Trigger real-time deduction update
            await upsertDeduction(member._id, companyId);

            console.log(`[CRON] Marked absent: ${member.name} (${todayKey})`);
          }
        }

        console.log("[CRON] Auto-absent job completed");
      } catch (err) {
        console.error("[CRON] Auto-absent error:", err.message);
      }
    },
    { timezone: "Africa/Lagos" },
  );
};

/**
 * CRON 2 — Monthly deduction refresh
 * Runs at midnight on the 1st of every month.
 * Recalculates and finalises every staff member's deduction record
 * for the month that just ended. Acts as a safety net in case any
 * real-time update was missed.
 */
const startMonthlyDeductionCron = () => {
  cron.schedule(
    "0 0 1 * *",
    async () => {
      console.log(
        "[CRON] Monthly deduction refresh started:",
        new Date().toISOString(),
      );

      try {
        const now = new Date();
        // We want last month
        const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const lastYear =
          now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        const companies = await Company.find({ is_active: true }).select("_id");

        for (const company of companies) {
          const staff = await User.find({
            company_id: company._id,
            role: "staff",
            is_active: true,
          }).select("_id");

          for (const member of staff) {
            await upsertDeduction(member._id, company._id);
          }

          console.log(
            `[CRON] Refreshed deductions for company ${company._id} — ${lastMonth}/${lastYear}`,
          );
        }

        console.log("[CRON] Monthly deduction refresh completed");
      } catch (err) {
        console.error("[CRON] Monthly deduction refresh error:", err.message);
      }
    },
    { timezone: "Africa/Lagos" },
  );
};

/**
 * CRON 3 — Auto clock-out at 5 PM
 * Runs at 5:00 PM WAT, Monday–Friday.
 * For every active staff member who has clocked in but not clocked out:
 *   - Auto clock them out
 *   - Fire notification
 *   - Trigger deduction update
 */
const startAutoClockOutCron = () => {
  cron.schedule(
    "0 17 * * 1-5",
    async () => {
      console.log(
        "[CRON] Auto clock-out job started:",
        new Date().toISOString(),
      );

      try {
        const companies = await Company.find({ is_active: true }).select("_id");

        for (const company of companies) {
          const companyId = company._id;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayKey = formatDateKey(today);

          // Find all attendance records for today where user clocked in but not clocked out
          const activeRecords = await Attendance.find({
            company_id: companyId,
            date_key: todayKey,
            clock_in: { $ne: null },
            clock_out: null,
          }).populate("user_id");

          for (const record of activeRecords) {
            const clockOutTime = new Date();
            clockOutTime.setHours(17, 0, 0, 0);

            // Update the record with clock_out time and mark as auto clocked out
            record.clock_out = clockOutTime;
            record.auto_clocked_out = true;
            await record.save();

            // Notify user
            await notify(
              record.user_id._id,
              companyId,
              "⏰ You were automatically clocked out at 5:00 PM as you forgot to clock out.",
              "auto_clockout",
            );

            // Trigger deduction update
            await upsertDeduction(record.user_id._id, companyId);

            console.log(
              `[CRON] Auto clocked out: ${record.user_id.name} (${todayKey})`,
            );
          }
        }

        console.log("[CRON] Auto clock-out job completed");
      } catch (err) {
        console.error("[CRON] Auto clock-out error:", err.message);
      }
    },
    { timezone: "Africa/Lagos" },
  );
};

/**
 * MIGRATION — Retroactively fix historical attendance records
 * For records from the past that have clock_in but no clock_out,
 * assume they were clocked out at 5 PM and mark them as auto_clocked_out.
 * This can be called manually via an admin endpoint.
 */
const retroactiveFillMissingClockouts = async () => {
  console.log("[MIGRATION] Starting retroactive clock-out fill...");

  try {
    const companies = await Company.find({ is_active: true }).select("_id");
    let totalFixed = 0;

    for (const company of companies) {
      const companyId = company._id;

      // Find all records from the past with clock_in but no clock_out
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const recordsToFix = await Attendance.find({
        company_id: companyId,
        clock_in: { $ne: null },
        clock_out: null,
        date: { $lt: yesterday },
        auto_clocked_out: false, // Skip if already marked as auto clocked out
      }).populate("user_id");

      for (const record of recordsToFix) {
        // Extract the date and set clock_out to 5 PM on that same day
        const clockOutTime = new Date(record.date);
        clockOutTime.setHours(17, 0, 0, 0);

        record.clock_out = clockOutTime;
        record.auto_clocked_out = true;
        await record.save();

        // Trigger deduction update
        await upsertDeduction(record.user_id._id, companyId);

        console.log(
          `[MIGRATION] Fixed: ${record.user_id.name} on ${formatDateKey(record.date)}`,
        );
        totalFixed++;
      }
    }

    console.log(`[MIGRATION] Completed. Fixed ${totalFixed} records.`);
    return { success: true, recordsFixed: totalFixed };
  } catch (err) {
    console.error("[MIGRATION] Error:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  startAbsentCron,
  startMonthlyDeductionCron,
  startAutoClockOutCron,
  retroactiveFillMissingClockouts,
};
