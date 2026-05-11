const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");
const WorkSettings = require("../models/WorkSettings");
const LeaveType = require("../models/LeaveType");
const Notification = require("../models/Notification");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const {
  sendActivationEmail,
  sendSetPasswordEmail,
  sendPasswordResetEmail,
} = require("../utils/email");

const normalizeCompanyName = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

// POST /api/auth/register
// Staff self-registration — creates account with status: pending

const register = async (req, res) => {
  try {
    const { name, email, companyName, department, password } = req.body;
    const normalizedInputCompany = normalizeCompanyName(companyName);

    // Resolve company by exact name to avoid attaching users to the wrong tenant
    const companies = await Company.find({});
    const company = companies.find(
      (item) => normalizeCompanyName(item.name) === normalizedInputCompany,
    );
    if (!company) {
      return res.status(404).json({
        message:
          "Company not found. Enter the exact organization name used by your admin.",
      });
    }

    const existing = await User.findOne({ company_id: company._id, email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      company_id: company._id,
      name,
      email,
      password,
      department,
      role: "staff",
      status: "pending",
    });

    // Notify all admins of the pending registration
    const admins = await User.find({
      company_id: company._id,
      role: "admin",
      status: "active",
    });
    await Notification.insertMany(
      admins.map((admin) => ({
        user_id: admin._id,
        company_id: company._id,
        message: `New registration pending: ${user.name} (${user.email})`,
        type: "registration_pending",
      })),
    );

    res.status(201).json({
      message:
        "Registration successful. Your account is awaiting activation by an admin.",
      emailStatus: "Email successful.",
      activationNote: "An admin will review and activate your account.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user globally by email; company is determined from the matched user
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.status === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is awaiting activation." });
    }

    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Your account has been deactivated. Contact HR." });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/refresh
// Rotate access token using a valid refresh token

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required." });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

// POST /api/auth/forgot-password
// Send a password reset link to the user's email

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user, token);

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password
// Consume reset token and set new password

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired." });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/set-password
// Used when admin creates a staff account — staff sets password via emailed link

const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "This link is invalid or has expired." });
    }

    user.password = password;
    user.status = "active";
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: "Password set successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/admin/register
// Admin creates company + account (Multi-tenant setup)

const adminRegister = async (req, res) => {
  try {
    const { companyName, adminName, email, password } = req.body;

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return res
        .status(409)
        .json({ message: "This company name is already registered." });
    }

    // Check if user email already exists globally
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }

    // We need to create the admin first to get their ID for the createdBy field
    const tempCompany = await Company.create({
      name: companyName,
      createdBy: new mongoose.Types.ObjectId(), // Temporary ID, will update below
    });

    // Create admin user with the company reference
    const admin = await User.create({
      company_id: tempCompany._id,
      name: adminName,
      email,
      password,
      role: "admin",
      status: "active",
      department: "Management",
    });

    // Update company to reference the admin who created it
    tempCompany.createdBy = admin._id;
    await tempCompany.save();

    // Initialize default WorkSettings for the company
    const workSettings = await WorkSettings.create({
      company_id: tempCompany._id,
      shiftStart: "09:00",
      lateGracePeriod: 15,
      absentCutoffTime: "11:30",
    });

    // Update company with work settings
    tempCompany.settings = workSettings._id;
    await tempCompany.save();

    // Initialize default LeaveTypes
    const defaultLeaveTypes = [
      { name: "Annual Leave", cap_days: 21, advance_days: 14 },
      { name: "Sick Leave", cap_days: 10, advance_days: 0 },
      { name: "Bereavement", cap_days: 5, advance_days: 0 },
    ];

    await LeaveType.insertMany(
      defaultLeaveTypes.map((lt) => ({
        company_id: tempCompany._id,
        name: lt.name,
        cap_days: lt.cap_days,
        advance_days: lt.advance_days,
      })),
    );

    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    res.status(201).json({
      message: "Company and admin account created successfully.",
      accessToken,
      refreshToken,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        company_id: tempCompany._id,
      },
      company: {
        _id: tempCompany._id,
        name: tempCompany.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/admin/login
// Admin login with company context

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email globally
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can login here. Use /api/auth/login for staff.",
      });
    }

    // Check if user is active
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account has been deactivated. Contact support.",
      });
    }

    if (user.status === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is awaiting activation." });
    }

    // Fetch company details
    const company = await Company.findById(user.company_id).populate(
      "settings",
    );
    if (!company) {
      return res.status(500).json({ message: "Company not found." });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: company._id,
      },
      company: {
        _id: company._id,
        name: company.name,
        settings: company.settings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  setPassword,
  adminRegister,
  adminLogin,
};
