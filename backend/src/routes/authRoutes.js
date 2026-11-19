import express from "express";
import {
  login,
  logout,
  checkEmail,
  refreshAccessToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
} from "../middleware/validateMiddleware.js";
import { rateLimit } from "express-rate-limit";

/**
 * AUTH ROUTES
 *
 * Rate limiting is applied specifically to sensitive auth endpoints
 * in addition to the global rate limiter in app.js.
 */

const router = express.Router();

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // 30 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no authentication required)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/check-email (Authenticate whether an email exists in the system)
router.post("/check-email", checkEmail);

// POST /api/v1/auth/login
router.post("/login", authLimiter, loginValidation, validate, login);

// POST /api/v1/auth/refresh-token
router.post("/refresh-token", refreshAccessToken);

// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  validate,
  forgotPassword
);

// PATCH /api/v1/auth/reset-password/:token
router.patch(
  "/reset-password/:token",
  resetPasswordValidation,
  validate,
  resetPassword
);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (valid access token required)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/auth/me
router.get("/me", protect, getMe);

// PATCH /api/v1/auth/profile
router.patch("/profile", protect, updateProfile);

// POST /api/v1/auth/logout
router.post("/logout", protect, logout);

// PATCH /api/v1/auth/change-password
router.patch(
  "/change-password",
  protect,
  changePasswordValidation,
  validate,
  changePassword
);

export default router;

