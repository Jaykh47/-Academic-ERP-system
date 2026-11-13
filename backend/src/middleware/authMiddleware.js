import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * AUTH MIDDLEWARE — protect()
 *
 * This middleware guards every protected route.
 * It runs BEFORE the controller and either:
 *   - Attaches req.user and calls next()  → request proceeds
 *   - Throws an ApiError(401)             → request blocked
 *
 * Token lookup order:
 * 1. HTTP-only cookie named "accessToken"  (browser clients)
 * 2. Authorization: Bearer <token> header  (Postman, mobile apps, server-to-server)
 *
 * Supporting both lets us test with Postman during development
 * while using secure cookies in the browser.
 *
 * Security checks performed:
 * ✅ Token exists
 * ✅ Token signature is valid (jwt.verify)
 * ✅ User with that ID still exists in DB
 * ✅ User account is still active (not deactivated)
 * ✅ Password was not changed after the token was issued
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Try to read from cookie first
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Fall back to Authorization header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ApiError(401, "You are not logged in. Please log in to continue.")
      );
    }

    // Verify the token signature and expiry.
    // jwt.verify throws if invalid or expired — caught by our try/catch,
    // then handled by globalErrorHandler (JsonWebTokenError / TokenExpiredError).
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check that the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ApiError(401, "The user associated with this token no longer exists.")
      );
    }

    // Check that the account is active
    if (!currentUser.isActive) {
      return next(
        new ApiError(
          403,
          "Your account has been deactivated. Please contact the administrator."
        )
      );
    }

    // Check if password was changed after this token was issued.
    // decoded.iat is the JWT "issued at" timestamp (Unix seconds).
    if (currentUser.hasPasswordChangedAfter(decoded.iat)) {
      return next(
        new ApiError(
          401,
          "Your password was recently changed. Please log in again."
        )
      );
    }

    // Attach user to request object — available to all subsequent middleware and controllers
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

