const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const PublicHoliday = require("../models/PublicHoliday");
const WorkSettings = require("../models/WorkSettings");
const Notification = require("../models/Notification");
const { upsertDeduction } = require("./deductionController");
const { formatDateKey } = require("../utils/dateHelpers");

//  helpers

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
};

const getSettings = async (companyId) => {
  const settings = await WorkSettings.findOne({ company_id: companyId });
  return (
    settings || {
      start_time: "09:00",
      grace_end: "09:30",
      absent_cutoff: "09:30",
    }
  );
};

const resolveStatus = (clockInDate, settings) => {
  const h = clockInDate.getHours();
  const m = clockInDate.getMinutes();
  const clockInMinutes = h * 60 + m;
  const grace = parseTime(settings.grace_end || "09:30");
  const graceMinutes = grace.hours * 60 + grace.minutes;
  return clockInMinutes <= graceMinutes ? "present" : "late";
};

const countLatesThisMonth = async (userId, companyId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Attendance.countDocuments({
    user_id: userId,
    company_id: companyId,
    status: "late",
    date: { $gte: start },
  });
};

const notify = async (userId, companyId, message, type = "warning") => {
  await Notification.create({
    user_id: userId,
    company_id: companyId,
    message,
    type,
  });
};

//  POST /api/attendance/clock-in

const clockIn = async (req, res) => {
  try {
    const { _id: userId, company_id: companyId } = req.user;
    const now = new Date();
    const dateKey = formatDateKey(now);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await Attendance.findOne({
      user_id: userId,
      company_id: companyId,
      date_key: dateKey,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked in today.",
      });
    }

    const onLeave = await Leave.findOne({
      user_id: userId,
      company_id: companyId,
      status: "approved",
      start_date: { $lte: today },
      end_date: { $gte: today },
    });
    if (onLeave) {
      return res
        .status(400)
        .json({ success: false, message: "You are on approved leave today." });
    }

    const holiday = await PublicHoliday.findOne({
      company_id: companyId,
      date_key: dateKey,
    });
    if (holiday) {
      return res.status(400).json({
        success: false,
        message: `Today is a public holiday: ${holiday.name}`,
      });
    }

    const settings = await getSettings(companyId);
    const status = resolveStatus(now, settings);

    const record = await Attendance.create({
      user_id: userId,
      company_id: companyId,
      date: today,
      date_key: dateKey,
      status,
      clock_in: now,
    });

    if (status === "late") {
      const lateCount = await countLatesThisMonth(userId, companyId);

      if (lateCount === 3) {
        await notify(
          userId,
          companyId,
          ` Warning: You have been late 3 times this month.`,
          "late_warning",
        );
      }

      if (lateCount % 5 === 0) {
        await notify(
          userId,
          companyId,
          ` You have been late ${lateCount} times this month. A salary deduction has been applied.`,
          "late_deduction",
        );
        await upsertDeduction(userId, companyId);
      }
    }

    return res.status(201).json({
      success: true,
      message:
        status === "present"
          ? "Clocked in successfully."
          : "Clocked in — marked as late.",
      data: { status, clock_in: record.clock_in, date_key: dateKey },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  POST /api/attendance/clock-out

const clockOut = async (req, res) => {
  try {
    const { _id: userId, company_id: companyId } = req.user;
    const now = new Date();
    const dateKey = formatDateKey(now);

    const record = await Attendance.findOne({
      user_id: userId,
      company_id: companyId,
      date_key: dateKey,
    });

    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "You have not clocked in today." });
    }
    if (record.clock_out) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked out today.",
      });
    }

    record.clock_out = now;
    await record.save();

    return res.json({
      success: true,
      message: "Clocked out successfully.",
      data: { clock_out: record.clock_out, clock_in: record.clock_in },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /api/attendance/me

const getMyAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20, month, year } = req.query;
    const { _id: userId, company_id: companyId } = req.user;

    const filter = { user_id: userId, company_id: companyId };

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(filter);
    const docs = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [present, late, absent] = await Promise.all([
      Attendance.countDocuments({
        user_id: userId,
        company_id: companyId,
        status: "present",
        date: { $gte: monthStart },
      }),
      Attendance.countDocuments({
        user_id: userId,
        company_id: companyId,
        status: "late",
        date: { $gte: monthStart },
      }),
      Attendance.countDocuments({
        user_id: userId,
        company_id: companyId,
        status: "absent",
        date: { $gte: monthStart },
      }),
    ]);

    res.json({
      success: true,
      data: docs,
      summary: { present, late, absent },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /api/attendance/today (staff)

const getToday = async (req, res) => {
  try {
    const { _id: userId, company_id: companyId } = req.user;
    const dateKey = formatDateKey(new Date());
    const record = await Attendance.findOne({
      user_id: userId,
      company_id: companyId,
      date_key: dateKey,
    });

    res.json({
      success: true,
      data: record || {
        status: "not_clocked_in",
        clock_in: null,
        clock_out: null,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /api/attendance/all (admin)

const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      department,
      user_id,
      date_from,
      date_to,
      status,
    } = req.query;
    const { company_id: companyId } = req.user;

    const filter = { company_id: companyId };
    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;

    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = new Date(date_from);
      if (date_to) filter.date.$lte = new Date(date_to + "T23:59:59");
    }

    if (department) {
      const User = require("../models/User");
      const users = await User.find({
        company_id: companyId,
        department,
        status: "active",
      }).select("_id");
      filter.user_id = { $in: users.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(filter);
    const docs = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user_id", "name email department");

    res.json({
      success: true,
      data: docs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /api/attendance/today-summary (admin)

const getTodaySummary = async (req, res) => {
  try {
    const { company_id: companyId } = req.user;
    const User = require("../models/User");
    const dateKey = formatDateKey(new Date());

    const [totalStaff, present, late, absent, onLeave] = await Promise.all([
      User.countDocuments({
        company_id: companyId,
        role: "staff",
        status: "active",
      }),
      Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "present",
      }),
      Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "late",
      }),
      Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "absent",
      }),
      Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "on_leave",
      }),
    ]);

    const notYetMarked = totalStaff - present - late - absent - onLeave;

    res.json({
      success: true,
      data: {
        totalStaff,
        present,
        late,
        absent,
        onLeave,
        notYetMarked,
        date_key: dateKey,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  PATCH /api/attendance/:id (admin)

const overrideAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, clock_in, clock_out, note } = req.body;
    const { _id: adminId, company_id: companyId } = req.user;

    const record = await Attendance.findOne({ _id: id, company_id: companyId });
    if (!record)
      return res
        .status(404)
        .json({ success: false, message: "Record not found." });

    if (status) record.status = status;
    if (clock_in) record.clock_in = new Date(clock_in);
    if (clock_out) record.clock_out = new Date(clock_out);
    if (note) record.override_note = note;
    record.overridden_by = adminId;

    await record.save();

    await upsertDeduction(record.user_id, companyId);

    res.json({
      success: true,
      message: "Attendance record updated.",
      data: record,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getMyAttendance,
  getToday,
  getAllAttendance,
  getTodaySummary,
  overrideAttendance,
};

//  GET /api/attendance/weekly (admin)
const getWeekly = async (req, res) => {
  try {
    const { company_id: companyId } = req.user;

    // Generate the last 7 days including today
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }

    const weeklyData = [];

    for (const date of dates) {
      const dateKey = formatDateKey(date);

      const presentCount = await Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: { $in: ["present", "late"] }, // Consider late as present for chart purposes
      });

      const absentCount = await Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "absent",
      });

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];

      const totalCount = presentCount + absentCount;
      const presentPercentage =
        totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      weeklyData.push({
        day: dayName,
        date: dateKey,
        present: presentCount,
        absent: absentCount,
        total: totalCount,
        value: presentPercentage,
      });
    }

    res.json({
      success: true,
      data: weeklyData,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

//  GET /api/attendance/monthly (admin)

const getMonthly = async (req, res) => {
  try {
    const { company_id: companyId } = req.user;

    // Get the current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Generate an array of all days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      dates.push(d);
    }

    const monthlyData = [];

    for (const date of dates) {
      const dateKey = formatDateKey(date);

      const presentCount = await Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: { $in: ["present", "late"] },
      });

      const absentCount = await Attendance.countDocuments({
        company_id: companyId,
        date_key: dateKey,
        status: "absent",
      });

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];

      const totalCount = presentCount + absentCount;
      const presentPercentage =
        totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      // Group by week in the month for display (show as "Week 1", "Week 2", etc.)
      const weekNumber = Math.ceil(date.getDate() / 7);

      monthlyData.push({
        day: `W${weekNumber}`,
        date: dateKey,
        present: presentCount,
        absent: absentCount,
        total: totalCount,
        value: presentPercentage,
      });
    }

    // Aggregate weekly data within the month for cleaner display
    const aggregatedData = [];
    let currentWeek = 1;
    let weekPresent = 0;
    let weekAbsent = 0;
    let weekTotal = 0;
    let dayCount = 0;

    for (let i = 0; i < monthlyData.length; i++) {
      const item = monthlyData[i];
      weekPresent += item.present;
      weekAbsent += item.absent;
      weekTotal += item.total;
      dayCount++;

      // Create a new entry at the end of each week or at the end of month
      if (dayCount === 7 || i === monthlyData.length - 1) {
        const weekPercentage =
          weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;
        aggregatedData.push({
          day: `Week ${currentWeek}`,
          present: weekPresent,
          absent: weekAbsent,
          total: weekTotal,
          value: weekPercentage,
        });

        currentWeek++;
        weekPresent = 0;
        weekAbsent = 0;
        weekTotal = 0;
        dayCount = 0;
      }
    }

    res.json({
      success: true,
      data: aggregatedData.length > 0 ? aggregatedData : monthlyData,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports.getWeekly = getWeekly;
module.exports.getMonthly = getMonthly;
