import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
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
  avatar: user.avatar || "",
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProfileForUser = async (user) => {
  if (!user) return null;
  if (user.role === "student") {
    return await Student.findOne({ userId: user._id })
      .populate("departmentId", "name code")
      .populate("admissionSessionId", "label year");
  }
  if (user.role === "faculty" || user.role === "hod") {
    return await Faculty.findOne({ userId: user._id })
      .populate("departmentId", "name code")
      .populate("subjects", "name code semester credits");
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/check-email
// Verifies whether an email address exists in the system
// ─────────────────────────────────────────────────────────────────────────────
export const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      throw new ApiError(400, "Email address is required.");
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Syntax validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new ApiError(422, "Please enter a valid email address format.");
    }

    const user = await User.findOne({ email: trimmedEmail }).select(
      "name role isActive avatar"
    );

    if (!user) {
      return res.status(200).json(
        new ApiResponse(200, "Email check completed.", {
          exists: false,
          email: trimmedEmail,
          message: "No account found with this email address.",
        })
      );
    }

    return res.status(200).json(
      new ApiResponse(200, "Account found.", {
        exists: true,
        email: trimmedEmail,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar || "",
        message: `Account verified for ${user.name} (${user.role.toUpperCase()}).`,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    // Find the user, explicitly selecting password (it's select:false by default)
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +refreshToken"
    );

    // 1. Authenticate whether the email address exists in the database
    if (!user) {
      return next(
        new ApiError(
          404,
          "No account found with this email address. Please check your email or contact the administrator."
        )
      );
    }

    // 2. Authenticate whether the password matches
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(
        new ApiError(
          401,
          "Incorrect password. Please verify your credentials and try again."
        )
      );
    }

    // 3. Check account is active
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

    const profile = await getProfileForUser(user);

    res.status(200).json(
      new ApiResponse(200, "Logged in successfully.", {
        user: sanitizeUser(user),
        profile,
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

    const profile = await getProfileForUser(user);

    res.status(200).json(
      new ApiResponse(200, "User profile fetched successfully.", {
        user: sanitizeUser(user),
        profile,
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

    // Re-issue tokens so the current session remains authenticated seamlessly
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json(
      new ApiResponse(
        200,
        "Password changed successfully.",
        { accessToken }
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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/profile
// Universal profile and avatar update for logged-in users (Student, Faculty, Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, phone, address, guardianName, guardianPhone, qualification } = req.body;

    const userUpdates = {};
    if (name && typeof name === "string") userUpdates.name = name.trim();
    if (avatar !== undefined) userUpdates.avatar = avatar;

    let user;
    if (Object.keys(userUpdates).length > 0) {
      user = await User.findByIdAndUpdate(req.user._id, userUpdates, { new: true, runValidators: true });
    } else {
      user = await User.findById(req.user._id);
    }

    // Role-specific profile updates
    const normalizePhone = (val) => {
      if (!val) return "";
      return String(val).trim().replace(/\s+/g, "");
    };

    if (user.role === "student") {
      const studentUpdates = {};
      if (phone !== undefined) studentUpdates.phone = normalizePhone(phone);
      if (address !== undefined) studentUpdates.address = String(address).trim();
      if (guardianName !== undefined) studentUpdates.guardianName = String(guardianName).trim();
      if (guardianPhone !== undefined) studentUpdates.guardianPhone = normalizePhone(guardianPhone);

      if (Object.keys(studentUpdates).length > 0) {
        await Student.findOneAndUpdate({ userId: user._id }, studentUpdates, { new: true, runValidators: true });
      }
    } else if (user.role === "faculty" || user.role === "hod") {
      const facultyUpdates = {};
      if (phone !== undefined) facultyUpdates.phone = normalizePhone(phone);
      if (qualification !== undefined) facultyUpdates.qualification = String(qualification).trim();

      if (Object.keys(facultyUpdates).length > 0) {
        await Faculty.findOneAndUpdate({ userId: user._id }, facultyUpdates, { new: true, runValidators: true });
      }
    }

    const updatedProfile = await getProfileForUser(user);

    res.status(200).json(
      new ApiResponse(200, "Profile updated successfully.", {
        user: sanitizeUser(user),
        profile: updatedProfile,
      })
    );
  } catch (error) {
    next(error);
  }
};

