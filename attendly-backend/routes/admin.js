const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const validate = require("../middleware/validate");
const { protect, adminOnly, sameCompany } = require("../middleware/auth");
const {
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
} = require("../controllers/adminController");

// All admin routes require auth + admin role
router.use(protect, sameCompany, adminOnly);

//  Staff
router.get("/staff", getStaff);
router.get("/staff/pending-debug", getPendingStaffDebug);

router.post(
  "/staff",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email required."),
    body("department")
      .isIn(["Integration", "Support"])
      .withMessage("Department must be Integration or Support."),
    body("role")
      .optional()
      .isIn(["admin", "staff"])
      .withMessage("Invalid role."),
    body("salary")
      .optional()
      .isNumeric()
      .withMessage("Salary must be a number."),
  ],
  validate,
  createStaff,
);

router.patch(
  "/staff/:id",
  [param("id").isMongoId().withMessage("Invalid staff ID.")],
  validate,
  updateStaff,
);

router.patch(
  "/staff/:id/activate",
  [param("id").isMongoId().withMessage("Invalid staff ID.")],
  validate,
  activateStaff,
);

router.patch(
  "/staff/:id/deactivate",
  [param("id").isMongoId().withMessage("Invalid staff ID.")],
  validate,
  deactivateStaff,
);

//  Holidays
router.get("/holidays", getHolidays);

router.post(
  "/holidays",
  [
    body("date")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date must be YYYY-MM-DD."),
    body("name").trim().notEmpty().withMessage("Holiday name is required."),
  ],
  validate,
  createHoliday,
);

router.post(
  "/holidays/sync",
  [
    body("country_code")
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage(
        "country_code must be 2-letter country code (e.g., US, GB, IN).",
      ),
    body("year")
      .isInt({ min: 2026, max: 2050 })
      .withMessage("year must be between 2026 and 2050."),
  ],
  validate,
  syncHolidays,
);

router.delete(
  "/holidays/:id",
  [param("id").isMongoId().withMessage("Invalid holiday ID.")],
  validate,
  deleteHoliday,
);

//  Work Settings
router.get("/settings", getSettings);

router.patch(
  "/settings",
  [
    body("start_time")
      .optional()
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("start_time must be HH:MM."),
    body("grace_end")
      .optional()
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("grace_end must be HH:MM."),
    body("absent_cutoff")
      .optional()
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("absent_cutoff must be HH:MM."),
  ],
  validate,
  updateSettings,
);

//  Leave Types
router.get("/leave-types", getLeaveTypes);

router.post(
  "/leave-types",
  [
    body("name").trim().notEmpty().withMessage("Leave type name is required."),
    body("cap_days")
      .isInt({ min: 0 })
      .withMessage("cap_days must be a non-negative integer."),
    body("advance_days")
      .optional()
      .isInt({ min: 0 })
      .withMessage("advance_days must be a non-negative integer."),
  ],
  validate,
  createLeaveType,
);

router.patch(
  "/leave-types/:id",
  [param("id").isMongoId().withMessage("Invalid leave type ID.")],
  validate,
  updateLeaveType,
);

// Migration endpoints
router.post("/migrate/historical-clockouts", migrateHistoricalClockouts);

module.exports = router;
