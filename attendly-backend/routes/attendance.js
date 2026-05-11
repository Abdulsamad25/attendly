const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const validate = require("../middleware/validate");
const { protect, adminOnly, sameCompany } = require("../middleware/auth");
const {
  clockIn,
  clockOut,
  getToday,
  getMyAttendance,
  getAllAttendance,
  overrideAttendance,
  getTodaySummary,
  getWeekly,
} = require("../controllers/attendanceController");
const { getMonthly } = require("../controllers/attendanceController");

// All attendance routes require authentication
router.use(protect, sameCompany);

// POST /api/attendance/clock-in
router.post("/clock-in", clockIn);

// POST /api/attendance/clock-out
router.post("/clock-out", clockOut);

// GET /api/attendance/me
router.get("/me", getMyAttendance);

// GET /api/attendance/today  (staff)
router.get("/today", getToday);

// GET /api/attendance/today-summary  (admin)
router.get("/today-summary", adminOnly, getTodaySummary);

// GET /api/attendance/all  (admin)
router.get("/all", adminOnly, getAllAttendance);

// GET /api/attendance/weekly (admin)
router.get("/weekly", adminOnly, getWeekly);

// GET /api/attendance/monthly (admin)
router.get("/monthly", adminOnly, getMonthly);

// PATCH /api/attendance/:id  (admin override)
router.patch(
  "/:id",
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid attendance ID."),
    body("status")
      .optional()
      .isIn(["present", "late", "absent", "on_leave", "holiday"])
      .withMessage("Invalid status value."),
  ],
  validate,
  overrideAttendance,
);

module.exports = router;
