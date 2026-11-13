/**
 * ApiResponse — Standardized Success Response Helper
 *
 * Every successful API endpoint should return the same structure:
 *
 * {
 *   "success": true,
 *   "message": "Human-readable description",
 *   "data": { ... }        // the actual payload
 * }
 *
 * Using this helper in every controller keeps responses consistent and
 * makes it easier to build the frontend later.
 *
 * Usage inside a controller:
 *   res.status(200).json(new ApiResponse(200, "Users fetched", { users }));
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - Success message
   * @param {*}      data       - Response payload (object, array, null, etc.)
   */
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400; // true for 2xx and 3xx
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }
}

export default ApiResponse;

