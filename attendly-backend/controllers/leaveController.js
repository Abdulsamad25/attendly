const Leave = require("../models/Leave");
const LeaveType = require("../models/LeaveType");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendLeaveDecisionEmail } = require("../utils/email");
const { getDateRange, getTodayKey } = require("../utils/dateHelpers");

// Helpers

// Count working days between two YYYY-MM-DD strings (excludes weekends)
const countWorkingDays = (startStr, endStr) => {
  const dates = getDateRange(startStr, endStr);
  return dates.filter((d) => {
    const day = new Date(d).getDay();
    return day !== 0 && day !== 6; // exclude Sunday (0) and Saturday (6)
  }).length;
};

// POST /api/leaves
// Staff submits a leave request

const createLeave = async (req, res) => {
  try {
    const user = req.user;
    const company_id = user.company_id;
    const { leave_type_id, start_date, end_date, reason } = req.body;

    const today = getTodayKey();

    // Validate leave type belongs to this company and is active
    const leaveType = await LeaveType.findOne({
      _id: leave_type_id,
      company_id,
      is_active: true,
    });

    if (!leaveType) {
      return res
        .status(404)
        .json({ message: "Leave type not found or inactive." });
    }

    // Enforce advance notice requirement
    if (leaveType.advance_days > 0) {
      const noticeDays = Math.ceil(
        (new Date(start_date) - new Date(today)) / (1000 * 60 * 60 * 24),
      );
      if (noticeDays < leaveType.advance_days) {
        return res.status(400).json({
          message: `${leaveType.name} requires at least ${leaveType.advance_days} day(s) advance notice.`,
        });
      }
    }

    // Check leave cap — count already approved/pending days this year
    if (leaveType.cap_days > 0) {
      const yearStart = `${new Date().getFullYear()}-01-01`;
      const yearEnd = `${new Date().getFullYear()}-12-31`;

      const existingLeaves = await Leave.find({
        user_id: user._id,
        company_id,
        leave_type_id,
        status: { $in: ["approved", "pending"] },
        start_date: { $gte: yearStart },
        end_date: { $lte: yearEnd },
      });

      const usedDays = existingLeaves.reduce((sum, l) => {
        return sum + countWorkingDays(l.start_date, l.end_date);
      }, 0);

      const requestedDays = countWorkingDays(start_date, end_date);

      if (usedDays + requestedDays > leaveType.cap_days) {
        return res.status(400).json({
          message: `This request exceeds your ${leaveType.name} cap. You have ${leaveType.cap_days - usedDays} day(s) remaining.`,
        });
      }
    }

    // Check for overlapping leave requests
    const overlap = await Leave.findOne({
      user_id: user._id,
      company_id,
      status: { $in: ["approved", "pending"] },
      $or: [{ start_date: { $lte: end_date }, end_date: { $gte: start_date } }],
    });

    if (overlap) {
      return res.status(409).json({
        message:
          "You already have a leave request that overlaps with these dates.",
      });
    }

    const leave = await Leave.create({
      user_id: user._id,
      company_id,
      leave_type_id,
      start_date,
      end_date,
      reason,
    });

    // Notify all admins of the new request
    const admins = await User.find({
      company_id,
      role: "admin",
      status: "active",
    });
    await Notification.insertMany(
      admins.map((admin) => ({
        user_id: admin._id,
        company_id,
        message: `${user.name} submitted a ${leaveType.name} request (${start_date} → ${end_date}).`,
        type: "leave_request",
      })),
    );

    res.status(201).json({ message: "Leave request submitted.", leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/me
// Staff views their own leave history — paginated

const getMyLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user_id: req.user._id, company_id: req.user.company_id };
    if (status) filter.status = status;

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate("leave_type_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Leave.countDocuments(filter),
    ]);

    res.json({
      leaves,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/all  (admin)
// Filter by status, staff, date range

const getAllLeaves = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const {
      status,
      staffId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = { company_id };
    if (status) filter.status = status;
    if (staffId) filter.user_id = staffId;
    if (startDate) filter.start_date = { $gte: startDate };
    if (endDate) filter.end_date = { ...filter.end_date, $lte: endDate };

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate("user_id", "name email department")
        .populate("leave_type_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Leave.countDocuments(filter),
    ]);

    res.json({
      leaves,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/leaves/:id/approve  (admin)

const approveLeave = async (req, res) => {
  try {
    const { admin_comment } = req.body;
    const company_id = req.user.company_id;

    const leave = await Leave.findOne({ _id: req.params.id, company_id })
      .populate("user_id")
      .populate("leave_type_id", "name");

    if (!leave)
      return res.status(404).json({ message: "Leave request not found." });
    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be approved." });
    }

    leave.status = "approved";
    leave.admin_comment = admin_comment || null;
    leave.reviewed_by = req.user._id;
    leave.reviewed_at = new Date();
    await leave.save();

    // Backfill attendance records for the approved leave dates
    const dates = getDateRange(leave.start_date, leave.end_date);
    for (const date of dates) {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      await Attendance.findOneAndUpdate(
        { user_id: leave.user_id._id, company_id, date_key: date },
        {
          user_id: leave.user_id._id,
          company_id,
          date: new Date(date),
          date_key: date,
          status: "on_leave",
        },
        { upsert: true, new: true },
      );
    }

    // Notify staff
    await Notification.create({
      user_id: leave.user_id._id,
      company_id,
      message: `Your ${leave.leave_type_id.name} request (${leave.start_date} → ${leave.end_date}) has been approved.`,
      type: "leave_approved",
    });

    await sendLeaveDecisionEmail(
      leave.user_id,
      leave,
      "approved",
      admin_comment,
    );

    res.json({ message: "Leave request approved.", leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/leaves/:id/reject  (admin)

const rejectLeave = async (req, res) => {
  try {
    const { admin_comment } = req.body;
    const company_id = req.user.company_id;

    const leave = await Leave.findOne({ _id: req.params.id, company_id })
      .populate("user_id")
      .populate("leave_type_id", "name");

    if (!leave)
      return res.status(404).json({ message: "Leave request not found." });
    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be rejected." });
    }

    leave.status = "rejected";
    leave.admin_comment = admin_comment || null;
    leave.reviewed_by = req.user._id;
    leave.reviewed_at = new Date();
    await leave.save();

    // Notify staff
    await Notification.create({
      user_id: leave.user_id._id,
      company_id,
      message: `Your ${leave.leave_type_id.name} request (${leave.start_date} → ${leave.end_date}) was rejected.${admin_comment ? ` Reason: ${admin_comment}` : ""}`,
      type: "leave_rejected",
    });

    await sendLeaveDecisionEmail(
      leave.user_id,
      leave,
      "rejected",
      admin_comment,
    );

    res.json({ message: "Leave request rejected.", leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/leaves/:id  (staff cancels their own pending request)

const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      user_id: req.user._id,
      company_id: req.user.company_id,
    });

    if (!leave)
      return res.status(404).json({ message: "Leave request not found." });

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be cancelled.",
      });
    }

    leave.status = "cancelled";
    await leave.save();

    res.json({ message: "Leave request cancelled." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/types
// Returns all active leave types for this company

const getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find({
      company_id: req.user.company_id,
      is_active: true,
    }).sort({ name: 1 });

    res.json({ types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/calendar  (admin)
// Returns approved leaves for a given month for the leave calendar screen

const getLeaveCalendar = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "month and year query params are required." });
    }

    const paddedMonth = String(month).padStart(2, "0");
    const startDate = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${paddedMonth}-${lastDay}`;

    const leaves = await Leave.find({
      company_id,
      status: "approved",
      start_date: { $lte: endDate },
      end_date: { $gte: startDate },
    })
      .populate("user_id", "name department")
      .populate("leave_type_id", "name");

    res.json({ leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leaves/balance  (staff)
// Returns remaining leave days per type for the current year

const getLeaveBalance = async (req, res) => {
  try {
    const user = req.user;
    const company_id = user.company_id;
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const yearEnd = `${new Date().getFullYear()}-12-31`;

    const leaveTypes = await LeaveType.find({ company_id, is_active: true });

    const balances = await Promise.all(
      leaveTypes.map(async (type) => {
        const usedLeaves = await Leave.find({
          user_id: user._id,
          company_id,
          leave_type_id: type._id,
          status: { $in: ["approved", "pending"] },
          start_date: { $gte: yearStart },
          end_date: { $lte: yearEnd },
        });

        const usedDays = usedLeaves.reduce(
          (sum, l) => sum + countWorkingDays(l.start_date, l.end_date),
          0,
        );

        return {
          leave_type: type,
          cap_days: type.cap_days,
          used_days: usedDays,
          remaining_days: Math.max(0, type.cap_days - usedDays),
        };
      }),
    );

    res.json({ balances });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveTypes,
  getLeaveCalendar,
  getLeaveBalance,
};
