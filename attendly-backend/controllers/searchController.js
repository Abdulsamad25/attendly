const User = require("../models/User");

// GET /api/search?q=query
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const { company_id: companyId } = req.user;

    if (!q || q.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q, "i");

    const users = await User.find({
      company_id: companyId,
      status: "active",
      $or: [{ name: regex }, { email: regex }, { department: regex }],
    })
      .select("name email department profilePicture role")
      .limit(10);

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  globalSearch,
};
