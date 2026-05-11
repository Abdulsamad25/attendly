const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const validate = require("../middleware/validate");
const {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  setPassword,
  adminRegister,
  adminLogin,
} = require("../controllers/authController");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("companyName")
      .trim()
      .notEmpty()
      .withMessage("Company name is required."),
    body("department")
      .isIn(["Integration", "Support"])
      .withMessage("Department must be Integration or Support."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
  ],
  validate,
  register,
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  login,
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required.")],
  validate,
  refresh,
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("A valid email is required.")],
  validate,
  forgotPassword,
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
  ],
  validate,
  resetPassword,
);

// POST /api/auth/set-password
router.post(
  "/set-password",
  [
    body("token").notEmpty().withMessage("Token is required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
  ],
  validate,
  setPassword,
);

// ADMIN ROUTES

// POST /api/auth/admin/register - Create company + first admin
router.post(
  "/admin/register",
  [
    body("companyName")
      .trim()
      .notEmpty()
      .withMessage("Company name is required."),
    body("adminName").trim().notEmpty().withMessage("Admin name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
  ],
  validate,
  adminRegister,
);

// POST /api/auth/admin/login - Admin login
router.post(
  "/admin/login",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  adminLogin,
);

module.exports = router;
