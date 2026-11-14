import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import corsOptions from "./config/corsOptions.js";
import "./models/index.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorMiddleware.js";

// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS APP SETUP
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ── 1. SECURITY HEADERS (Helmet) ─────────────────────────────────────────────
// Helmet sets a collection of HTTP response headers that protect against
// common web vulnerabilities (clickjacking, MIME sniffing, XSS, etc.).
// Always apply this FIRST before other middleware.
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────────────────────
// Cross-Origin Resource Sharing — restricts which domains can call our API.
// credentials: true is required so the browser sends cookies cross-origin.
app.use(cors(corsOptions));

// ── 3. RATE LIMITING ─────────────────────────────────────────────────────────
// Prevents brute-force attacks and API abuse by limiting how many requests
// a single IP address can make within a time window.
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000,
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers (deprecated)
  skip: () => process.env.NODE_ENV === "development", // Disable rate limiting in local dev
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// ── 4. BODY PARSERS ───────────────────────────────────────────────────────────
// Parse incoming JSON request bodies (e.g. POST/PUT request payloads).
// Limit: 10kb — prevents excessively large payloads from reaching controllers.
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded bodies (HTML form submissions).
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── 5. COOKIE PARSER ─────────────────────────────────────────────────────────
// Parses Cookie header and populates req.cookies.
// Required for reading HTTP-only JWT refresh tokens from cookies.
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// All routes are mounted under the /api/v1/ prefix.
// This versioning strategy lets us release /api/v2/ later without breaking
// clients that still use v1.
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/v1/health",   healthRoutes);
app.use("/api/v1/auth",     authRoutes);
app.use("/api/v1/admin",    adminRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/faculty",  facultyRoutes);
app.use("/api/v1/academic",   academicRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/marks",         marksRoutes);
app.use("/api/v1/analytics",     analyticsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reports",       reportRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// These MUST be registered AFTER all routes.
// Express identifies error handlers by the (err, req, res, next) signature.
// ─────────────────────────────────────────────────────────────────────────────

// Catch requests that did not match any route
app.use(notFoundHandler);

// Handle all errors (thrown or passed via next(error))
app.use(globalErrorHandler);

export default app;

