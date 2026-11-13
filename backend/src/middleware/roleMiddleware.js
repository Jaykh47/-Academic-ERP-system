import ApiError from "../utils/ApiError.js";

/**
 * ROLE MIDDLEWARE — authorize(...roles)
 *
 * This middleware enforces Role-Based Access Control (RBAC).
 * It MUST run AFTER the protect() middleware, because it reads req.user
 * which protect() populates.
 *
 * Usage in routes:
 *   router.get("/admin-only", protect, authorize("admin"), controller)
 *   router.get("/faculty-hod", protect, authorize("faculty", "hod"), controller)
 *
 * How it works:
 * - `authorize` is a factory function that returns a middleware.
 * - The returned middleware checks whether req.user.role is in the allowed list.
 * - If not, it blocks the request with 403 Forbidden.
 *
 * 403 vs 401:
 * - 401 Unauthorized → "I don't know who you are" (no token or invalid token)
 * - 403 Forbidden    → "I know who you are, but you don't have permission"
 *
 * @param {...string} roles - Allowed role names (e.g. "admin", "faculty")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This should not happen if protect() ran first, but guard anyway
      return next(new ApiError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`
        )
      );
    }

    next();
  };
};

