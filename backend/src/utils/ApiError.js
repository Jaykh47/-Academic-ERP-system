/**
 * ApiError — Custom Error Class
 *
 * Why extend the native Error class?
 * JavaScript's built-in Error only carries a message.
 * Our API needs to send structured JSON errors with:
 *   - statusCode  → maps to HTTP status (400, 401, 404, 500, …)
 *   - message     → human-readable description
 *   - errors      → array of field-level validation errors (optional)
 *   - isOperational → distinguishes expected errors (bad input, not found)
 *                     from unexpected bugs (programmer errors, DB crashes)
 *
 * The centralized error middleware reads these properties and builds the
 * consistent JSON response the client receives.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (e.g. 400, 401, 404)
   * @param {string} message     - Error description shown to the client
   * @param {Array}  errors      - Optional array of validation error details
   */
  constructor(statusCode, message, errors = []) {
    // Call the parent Error constructor with the message
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    // Operational errors are predictable (bad input, auth failure, etc.)
    // Non-operational errors are bugs we did not anticipate.
    // The error middleware uses this flag to decide how much detail to expose.
    this.isOperational = true;

    // Capture a clean stack trace that excludes this constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;

