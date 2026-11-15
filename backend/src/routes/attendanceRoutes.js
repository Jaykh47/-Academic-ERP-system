import express from "express";
import {
  createClassSession,
  getAllClassSessions,
  getClassSessionById,
  submitAttendance,
  correctAttendance,
  getSubjectAttendanceSummary,
  getMyAttendance,
  getStudentAttendance,
  getStudentAttendanceSummary,
  getPredictiveRecovery,
  getMyAttendanceSummary,
  getMyPredictiveRecovery,
  getAttendanceShortageReport,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createClassSessionValidation,
  submitAttendanceValidation,
  correctAttendanceValidation,
  validate,
} from "../middleware/validateMiddleware.js";

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

// ── SESSIONS ─────────────────────────────────────────────────────────────────
router.post(
  "/sessions",
  authorize("admin", "hod", "faculty"),
  createClassSessionValidation,
  validate,
  createClassSession
);

router.get(
  "/sessions",
  authorize("admin", "hod", "faculty", "student"),
  getAllClassSessions
);

router.get(
  "/sessions/:sessionId",
  authorize("admin", "hod", "faculty", "student"),
  getClassSessionById
);

// ── SUBMISSION & CORRECTION ──────────────────────────────────────────────────
router.post(
  "/submit",
  authorize("admin", "hod", "faculty"),
  submitAttendanceValidation,
  validate,
  submitAttendance
);

router.patch(
  "/:attendanceId/correct",
  authorize("admin", "hod", "faculty"),
  correctAttendanceValidation,
  validate,
  correctAttendance
);

// ── ANALYTICS & REPORTS ──────────────────────────────────────────────────────
router.get(
  "/subject/:subjectId/summary",
  authorize("admin", "hod", "faculty"),
  getSubjectAttendanceSummary
);

router.get(
  "/my-attendance",
  authorize("student"),
  getMyAttendance
);

router.get(
  "/my-summary",
  authorize("student"),
  getMyAttendanceSummary
);

router.get(
  "/my-recovery",
  authorize("student"),
  getMyPredictiveRecovery
);

router.get(
  "/student/:studentId/summary",
  authorize("admin", "hod", "faculty", "student"),
  getStudentAttendanceSummary
);

router.get(
  "/student/:studentId/predictive-recovery",
  authorize("admin", "hod", "faculty", "student"),
  getPredictiveRecovery
);

router.get(
  "/student/:studentId",
  authorize("admin", "hod", "faculty", "student"),
  getStudentAttendance
);

router.get(
  "/shortage",
  authorize("admin", "hod", "faculty"),
  getAttendanceShortageReport
);

export default router;

