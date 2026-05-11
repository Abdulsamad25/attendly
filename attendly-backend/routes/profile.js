const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

// All profile routes require authentication
router.use(protect);

// GET /api/profile
router.get("/", getProfile);

// PUT /api/profile
router.put(
  "/",
  [
    body("bio").optional().isString().trim(),
    body("phoneNumber").optional().isString().trim(),
    body("address").optional().isString().trim(),
    body("profilePicture").optional().isString(),
  ],
  validate,
  updateProfile
);

// PUT /api/profile/password
router.put(
  "/password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters."),
  ],
  validate,
  changePassword
);

module.exports = router;
