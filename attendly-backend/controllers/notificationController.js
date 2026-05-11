const Notification = require("../models/Notification");
const User = require("../models/User");

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { _id: userId, company_id: companyId } = req.user;
    
    const notifications = await Notification.find({ user_id: userId, company_id: companyId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender_id", "name profilePicture department");

    const unreadCount = await Notification.countDocuments({ user_id: userId, company_id: companyId, is_read: false });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, company_id: companyId } = req.user;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: userId, company_id: companyId },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// POST /api/notifications/send
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const { _id: senderId, company_id: companyId, role } = req.user;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let targetUsers = [];

    if (receiverId === "all" && role === "admin") {
      // Admin broadcasting to all staff
      const staff = await User.find({ company_id: companyId, status: "active", role: "staff" });
      targetUsers = staff.map(s => s._id);
    } else if (receiverId) {
      // Sending to specific user
      targetUsers = [receiverId];
    } else if (role === "staff") {
      // Staff sending to admin implicitly (first admin)
      const admin = await User.findOne({ company_id: companyId, role: "admin", status: "active" });
      if (admin) targetUsers = [admin._id];
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ success: false, message: "No valid recipient found" });
    }

    const notifications = targetUsers.map(userId => ({
      user_id: userId,
      company_id: companyId,
      message,
      type: "message",
      sender_id: senderId,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  sendMessage,
};
