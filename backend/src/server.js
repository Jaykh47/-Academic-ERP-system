/**
 * server.js — Application Entry Point
 *
 * Startup sequence (order matters):
 *
 * 1. Load environment variables FIRST — before any other import reads them.
 * 2. Connect to MongoDB — before accepting any HTTP traffic.
 * 3. Start the HTTP server — only after the DB is ready.
 *
 * We also register handlers for unhandled promise rejections and
 * uncaught exceptions to ensure the process exits cleanly on critical errors.
 *
 * Why separate app.js from server.js?
 * - app.js configures Express (middleware, routes) — no I/O side effects.
 * - server.js manages I/O: DB connection and HTTP server lifecycle.
 * - This separation makes the Express app easier to test in isolation.
 */

import "dotenv/config"; // Must be the very first import
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// ── Catch unhandled promise rejections ────────────────────────────────────────
// These are async errors that were NOT caught with try/catch or .catch().
// Without this handler, Node.js may silently swallow errors.
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Promise Rejection:", reason);
  // Give the server time to finish pending requests, then shut down
  server.close(() => {
    console.error("Server closed due to unhandled rejection. Exiting...");
    process.exit(1);
  });
});

// ── Catch synchronous uncaught exceptions ────────────────────────────────────
// These are errors thrown outside any async context (rare but fatal).
process.on("uncaughtException", (error) => {
  console.error("🔴 Uncaught Exception:", error);
  process.exit(1);
});

// ── Startup function ─────────────────────────────────────────────────────────
const startServer = async () => {
  // Step 1: Connect to MongoDB first
  await connectDB();

  // Step 2: Only start the HTTP server after DB is ready
  const server = app.listen(PORT, () => {
    console.log("─────────────────────────────────────────────");
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/v1/health`);
    console.log("─────────────────────────────────────────────");
  });

  // ── Graceful shutdown on SIGTERM (e.g. from PM2 or Docker) ───────────────
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  });
};

startServer();

