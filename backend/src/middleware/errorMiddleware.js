import ApiError from "../utils/ApiError.js";

/**
 * NOT FOUND HANDLER
 *
 * This middleware catches every request that did not match any route.
 * Express calls it when no previous route handler sent a response.
 *
 * We convert the unmatched request into an ApiError(404) and pass it
 * to the global error handler below.
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
  next(error);
};

/**
 * GLOBAL ERROR HANDLER
 *
 * Express identifies a "global error handler" by its four parameters: (err, req, res, next).
 * This must be the LAST middleware registered in app.js.
 *
 * It handles three categories of errors:
 *
 * 1. ApiError instances        → Operational errors we threw intentionally.
 *                                 Safe to send the message to the client.
 *
 * 2. Mongoose ValidationError  → Schema-level validation failure.
 *                                 Extract field messages and return 400.
 *
 * 3. Mongoose CastError        → Usually an invalid MongoDB ObjectId.
 *                                 Return 400 with a clean message.
 *
 * 4. JWT errors                → Return 401.
 *
 * 5. Duplicate key error (11000) → MongoDB unique constraint violated.
 *                                   Return 409 Conflict.
 *
 * 6. Everything else           → Unexpected bug. Return 500.
 *                                 In production, never expose the real message.
 */
const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // ── Mongoose: invalid ObjectId ────────────────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // ── Mongoose: schema validation failure ───────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── MongoDB: duplicate key (unique constraint) ────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this '${field}' already exists.`;
  }

  // ── JWT: token is malformed ───────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  // ── JWT: token has expired ────────────────────────────────────────────────
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // ── Log the full error in development; keep production logs minimal ───────
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Error:", err);
  } else {
    // In production, only log unexpected server errors
    if (statusCode === 500) {
      console.error("🔴 Unexpected server error:", err);
    }
  }

  // ── Send the response ─────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message:
      // In production, don't expose internal error details for 500 errors
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "An unexpected error occurred. Please try again later."
        : message,
    ...(errors.length > 0 && { errors }),
    // Include stack trace only in development for debugging
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export { notFoundHandler, globalErrorHandler };

