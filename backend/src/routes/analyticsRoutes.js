import express from "express";
import {
  getDepartmentAnalytics,
  getSubjectAnalytics,
  getCohortAnalytics,
  getAcademicRiskReport,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { param, query } from "express-validator";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

// All analytics endpoints require authentication
router.use(protect);

// ── 1. DEPARTMENT ANALYTICS ──────────────────────────────────────────────────
router.get(
  "/department/:departmentId",
  authorize("admin", "hod"),
  param("departmentId").isMongoId().withMessage("Invalid department ID"),
  validate,
  getDepartmentAnalytics
);

// ── 2. SUBJECT ANALYTICS ─────────────────────────────────────────────────────
router.get(
  "/subject/:subjectId",
  authorize("admin", "hod", "faculty"),
  param("subjectId").isMongoId().withMessage("Invalid subject ID"),
  validate,
  getSubjectAnalytics
);

// ── 3. COHORT ANALYTICS ──────────────────────────────────────────────────────
router.get(
  "/cohort",
  authorize("admin", "hod", "faculty"),
  query("departmentId").isMongoId().withMessage("Invalid department ID"),
  query("semester").isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),
  validate,
  getCohortAnalytics
);

// ── 4. ACADEMIC RISK DETECTION REPORT ────────────────────────────────────────
router.get(
  "/risk-detection",
  authorize("admin", "hod", "faculty"),
  getAcademicRiskReport
);

export default router;

