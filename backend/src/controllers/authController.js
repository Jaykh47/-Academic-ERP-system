import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/generateToken.js";

/**
 * AUTH CONTROLLER
 *
 * Handles all authentication operations.
 * Controllers are kept thin — they orchestrate the flow but delegate
 * logic to utilities and models.
 *
 * All handlers are async and wrapped with try/catch.
 * Errors are passed to next() so globalErrorHandler formats them.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Strip sensitive fields before sending user in response
// Never expose password, refreshToken, or reset token fields to the client.
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the user, explicitly selecting password (it's select:false by default)
    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );

    // SECURITY: Use the same error message for "user not found" and
    // "wrong password" to prevent user enumeration attacks.
    // (An attacker should not be able to tell if an email exists in the system.)
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, "Invalid email or password."));
    }

    // Check account is active
    if (!user.isActive) {
      return next(
        new ApiError(
          403,
          "Your account has been deactivated. Please contact the administrator."
        )
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store HASHED refresh token in DB for revocation support
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Set both tokens in HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json(
      new ApiResponse(200, "Logged in successfully.", {
        user: sanitizeUser(user),
        accessToken, // Also send in body for Postman / API clients
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// Protected route — requires a valid access token
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    // Clear the hashed refresh token from the database.
    // This "revokes" the refresh token — even if the client somehow retains
    // the refresh token cookie, it will fail validation next time.
    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: "" } },
      { new: true }
    );

    // Clear cookies from the browser
    clearAuthCookies(res);

    res.status(200).json(new ApiResponse(200, "Logged out successfully."));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh-token
// Public route — uses refresh token cookie to issue new tokens
// ─────────────────────────────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res, next) => {
  try {
    // Read refresh token from cookie (or body for API clients)
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return next(new ApiError(401, "Refresh token not provided. Please log in."));
    }

    // Verify the JWT signature
    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return next(
        new ApiError(401, "Refresh token is invalid or expired. Please log in again.")
      );
    }

    // Find the user and retrieve their stored hashed refresh token
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken) {
      return next(
        new ApiError(401, "Session has been invalidated. Please log in again.")
      );
    }

    // Compare the incoming token's hash to what's stored in DB
    const hashedIncoming = hashToken(incomingRefreshToken);
    if (hashedIncoming !== user.refreshToken) {
      // Token doesn't match — could be a replay attack using an old token.
      // Clear the stored token as a security measure (force re-login).
      await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: "" } });
      clearAuthCookies(res);
      return next(
        new ApiError(
          401,
          "Invalid refresh token detected. Session terminated for security. Please log in again."
        )
      );
    }

    if (!user.isActive) {
      return next(
        new ApiError(403, "Account deactivated. Please contact the administrator.")
      );
    }

    // TOKEN ROTATION: Generate a completely new pair of tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace the old hashed refresh token in DB
    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json(
      new ApiResponse(200, "Access token refreshed successfully.", {
        accessToken: newAccessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me
// Protected route — returns the current logged-in user's profile
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is already set by authMiddleware.protect
    // Fetch a fresh copy from DB (in case of recent profile updates)
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    res.status(200).json(
      new ApiResponse(200, "User profile fetched successfully.", {
        user: sanitizeUser(user),
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/change-password
// Protected route
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch user with password (it's select:false)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(401, "Current password is incorrect."));
    }

    // Set new password — the pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    // After a password change, invalidate all existing sessions by
    // clearing the refresh token. User must log in again on other devices.
    await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: "" } });
    clearAuthCookies(res);

    res.status(200).json(
      new ApiResponse(
        200,
        "Password changed successfully. Please log in again with your new password."
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// Public route
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // SECURITY: Always return the same response whether the email exists or not.
    // This prevents user enumeration (attacker discovering registered emails).
    if (!user) {
      return res.status(200).json(
        new ApiResponse(
          200,
          "If an account with that email exists, a password reset link has been sent."
        )
      );
    }

    // Generate a secure random reset token
    const { rawToken, hashedToken, expiresAt } = generatePasswordResetToken();

    // Store hashed token and expiry in DB
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    // In production, you would send rawToken via email here.
    // For now (development / no email service), we include it in the response.
    // This block must be REMOVED and replaced with an email service in production.
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔑 [DEV] Password Reset Token for ${email}: ${rawToken}\n`);
      return res.status(200).json(
        new ApiResponse(
          200,
          "Password reset token generated (development mode — check server console).",
          {
            devOnly_resetToken: rawToken,
            devOnly_expiresAt: expiresAt,
            message: "In production, this token is sent via email, not in the response.",
          }
        )
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "If an account with that email exists, a password reset link has been sent."
      )
    );
  } catch (error) {
    // If anything fails after storing the reset token, clean it up
    await User.findOneAndUpdate(
      { email: req.body.email },
      { $unset: { passwordResetToken: "", passwordResetExpires: "" } }
    );
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/reset-password/:token
// Public route
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the incoming raw token to compare with the stored hash
    const hashedToken = hashToken(token);

    // Find user where:
    // - stored token matches AND
    // - token has not expired yet
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return next(
        new ApiError(400, "Password reset token is invalid or has expired.")
      );
    }

    // Set the new password — pre-save hook will hash it
    user.password = password;
    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Clear any active refresh token to force re-login everywhere
    user.refreshToken = undefined;
    await user.save();

    clearAuthCookies(res);

    res.status(200).json(
      new ApiResponse(
        200,
        "Password has been reset successfully. Please log in with your new password."
      )
    );
  } catch (error) {
    next(error);
  }
};

