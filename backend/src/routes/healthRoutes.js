import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * GET /api/v1/health
 *
 * Health-check endpoint.
 *
 * Purpose:
 * - Verify that the server is running.
 * - Verify that MongoDB is connected.
 * - Provide basic system info (useful for DevOps / deployment verification).
 *
 * This endpoint requires no authentication — it must be reachable at any time.
 * Load balancers and monitoring tools use it to check service availability.
 *
 * MongoDB readyState values:
 *   0 = disconnected
 *   1 = connected      ← what we want
 *   2 = connecting
 *   3 = disconnecting
 */
router.get("/", (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isHealthy = dbStatus === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy
      ? "Server is healthy and database is connected."
      : "Server is running but database is not connected.",
    data: {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      database: {
        status: dbStatusMap[dbStatus] || "unknown",
      },
    },
  });
});

export default router;

