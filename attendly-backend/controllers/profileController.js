const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -passwordResetToken -passwordResetExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { bio, phoneNumber, address, profilePicture } = req.body;
    
    // Build update object
    const updateFields = {};
    if (bio !== undefined) updateFields.bio = bio;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (address !== undefined) updateFields.address = address;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    res.json({ success: true, message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// PUT /api/profile/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide both current and new passwords" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
    }

    // Explicitly select password to compare
    const user = await User.findById(req.user._id).select("+password");
    
    // Check current password
    if (!user.password) {
      return res.status(400).json({ success: false, message: "You don't have a password set. Please use the reset password flow." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
