const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getNotifications,
  markAsRead,
  sendMessage,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/send", sendMessage);

module.exports = router;
