const crypto = require("crypto");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const PublicHoliday = require("../models/PublicHoliday");
const WorkSettings = require("../models/WorkSettings");
const Company = require("../models/Company");
const { sendSetPasswordEmail } = require("../utils/email");
const { sendActivationEmail } = require("../utils/email");
const Notification = require("../models/Notification");

// STAFF MANAGEMENT

// GET /api/admin/staff
const getStaff = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { department, status, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { company_id };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [staff, total] = await Promise.all([
      User.find(filter)
        .select("-password -passwordResetToken -passwordResetExpires")
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      staff,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/staff/pending-debug
// Quick diagnostics to verify admin company and pending users in same tenant
const getPendingStaffDebug = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const [company, pendingUsers] = await Promise.all([
      Company.findById(company_id).select("_id name"),
      User.find({ company_id, status: "pending" })
        .select("_id name email status company_id createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      adminUser: {
        _id: req.user._id,
        email: req.user.email,
        company_id,
      },
      company: company || null,
      pendingCount: pendingUsers.length,
      pendingUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/staff — admin creates a staff account
const createStaff = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { name, email, department, role = "staff", salary = 0 } = req.body;

    const existing = await User.findOne({ company_id, email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    // Create account with no password — staff will set it via email link
    const user = await User.create({
      company_id,
      name,
      email,
      department,
      role,
      salary,
      status: "active", // admin-created accounts are active immediately
    });

    // Generate set-password token
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    try {
      await sendSetPasswordEmail(user, rawToken);
      return res.status(201).json({
        message: `Account created. A set-password email has been sent to ${email}.`,
        user,
      });
    } catch (emailError) {
      return res.status(201).json({
        message:
          "Account created, but we could not send the set-password email. Please verify email settings and resend the invite.",
        emailDeliveryFailed: true,
        emailError: emailError.message,
        user,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/staff/:id
const updateStaff = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { name, department, role, salary } = req.body;

    const user = await User.findOne({ _id: req.params.id, company_id });
    if (!user)
      return res.status(404).json({ message: "Staff member not found." });

    if (name) user.name = name;
    if (department) user.department = department;
    if (role) user.role = role;
    if (salary !== undefined) user.salary = salary;

    await user.save();

    res.json({ message: "Staff record updated.", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/staff/:id/activate — activate a pending self-registered account
const activateStaff = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const user = await User.findOne({ _id: req.params.id, company_id });
    if (!user)
      return res.status(404).json({ message: "Staff member not found." });

    if (user.status === "active") {
      return res.status(400).json({ message: "Account is already active." });
    }

    user.status = "active";
    await user.save();

    await Notification.create({
      user_id: user._id,
      company_id,
      message:
        "Your account has been activated. You can now log in to Attendly.",
      type: "account_activated",
    });

    try {
      await sendActivationEmail(user);
      return res.json({
        message: `${user.name}'s account has been activated.`,
        user,
      });
    } catch (emailError) {
      return res.json({
        message: `${user.name}'s account has been activated.`,
        emailDeliveryWarning:
          "Account was activated, but activation email could not be sent.",
        emailError:
          process.env.NODE_ENV !== "production"
            ? emailError.message
            : undefined,
        user,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/staff/:id/deactivate
const deactivateStaff = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const user = await User.findOne({ _id: req.params.id, company_id });
    if (!user)
      return res.status(404).json({ message: "Staff member not found." });

    if (user._id.equals(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account." });
    }

    user.status = "inactive";
    await user.save();

    res.json({ message: `${user.name}'s account has been deactivated.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC HOLIDAYS

// GET /api/admin/holidays
const getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = { company_id: req.user.company_id };
    if (year) {
      filter.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }

    const holidays = await PublicHoliday.find(filter).sort({ date: 1 });
    res.json({ holidays });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/holidays
const createHoliday = async (req, res) => {
  try {
    const { date, name } = req.body;
    const company_id = req.user.company_id;

    const existing = await PublicHoliday.findOne({ company_id, date });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A holiday already exists on this date." });
    }

    const holiday = await PublicHoliday.create({ company_id, date, name });
    res.status(201).json({ message: "Holiday added.", holiday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/holidays/:id
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await PublicHoliday.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id,
    });

    if (!holiday)
      return res.status(404).json({ message: "Holiday not found." });

    res.json({ message: "Holiday removed." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/holidays/sync
// Syncs real public holidays from external API
const syncHolidays = async (req, res) => {
  try {
    const { country_code, year } = req.body;
    const company_id = req.user.company_id;

    if (!country_code || !year) {
      return res
        .status(400)
        .json({ message: "country_code and year are required." });
    }

    // Validate year is current or future
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      return res
        .status(400)
        .json({ message: "Cannot sync holidays for past years." });
    }

    // Fetch holidays from NagerDate API (free, no auth required)
    const response = await fetch(
      `https://date.nager.at/api/v3/publicholidays/${year}/${country_code}`,
    );

    if (!response.ok) {
      return res
        .status(400)
        .json({ message: `Invalid country code: ${country_code}` });
    }

    const holidays = await response.json();

    // Save holidays to database, skip duplicates
    const syncedHolidays = [];
    for (const holiday of holidays) {
      const existing = await PublicHoliday.findOne({
        company_id,
        date: holiday.date,
      });

      if (!existing) {
        const created = await PublicHoliday.create({
          company_id,
          date: holiday.date, // Already in YYYY-MM-DD format
          name: holiday.name,
        });
        syncedHolidays.push(created);
      }
    }

    res.json({
      message: `Synced ${syncedHolidays.length} new holidays from ${country_code} for ${year}.`,
      synced: syncedHolidays,
      total: holidays.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// WORK SETTINGS

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await WorkSettings.findOne({
      company_id: req.user.company_id,
    });
    if (!settings)
      return res.status(404).json({ message: "Settings not configured." });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const { start_time, grace_end, absent_cutoff } = req.body;
    const company_id = req.user.company_id;

    const settings = await WorkSettings.findOneAndUpdate(
      { company_id },
      { start_time, grace_end, absent_cutoff },
      { new: true, upsert: true, runValidators: true },
    );

    res.json({ message: "Work settings updated.", settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LEAVE TYPES (admin manages)

// GET /api/admin/leave-types
const getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find({
      company_id: req.user.company_id,
    }).sort({ name: 1 });
    res.json({ types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/leave-types
const createLeaveType = async (req, res) => {
  try {
    const { name, cap_days, advance_days = 0, is_active = true } = req.body;
    const company_id = req.user.company_id;

    const leaveType = await LeaveType.create({
      company_id,
      name,
      cap_days,
      advance_days,
      is_active,
    });

    res.status(201).json({ message: "Leave type created.", leaveType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/leave-types/:id
const updateLeaveType = async (req, res) => {
  try {
    const { name, cap_days, advance_days, is_active } = req.body;

    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { name, cap_days, advance_days, is_active },
      { new: true, runValidators: true },
    );

    if (!leaveType)
      return res.status(404).json({ message: "Leave type not found." });

    res.json({ message: "Leave type updated.", leaveType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/migrate-historical-clockouts
// Admin endpoint to retroactively fill missing clock-outs from before auto clock-out was implemented
const migrateHistoricalClockouts = async (req, res) => {
  try {
    const {
      retroactiveFillMissingClockouts,
    } = require("../jobs/attendanceCron");
    const result = await retroactiveFillMissingClockouts();

    if (result.success) {
      res.json({
        message: `Successfully fixed ${result.recordsFixed} historical attendance records.`,
        recordsFixed: result.recordsFixed,
      });
    } else {
      res.status(500).json({
        message: "Migration failed.",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaff,
  getPendingStaffDebug,
  createStaff,
  updateStaff,
  activateStaff,
  deactivateStaff,
  getHolidays,
  createHoliday,
  deleteHoliday,
  syncHolidays,
  getSettings,
  updateSettings,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  migrateHistoricalClockouts,
};
