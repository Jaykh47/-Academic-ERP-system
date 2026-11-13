/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * Why restrictive CORS matters:
 * Without CORS restrictions, any website on the internet could make
 * authenticated API calls on behalf of your logged-in users.
 *
 * We read allowed origins from the environment variable so we can allow
 * localhost in development and the real frontend URL in production —
 * without touching code.
 */

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

const corsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!requestOrigin) return callback(null, true);

    if (allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${requestOrigin}' is not allowed.`));
    }
  },

  // Allow cookies and Authorization headers to be sent cross-origin
  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;

