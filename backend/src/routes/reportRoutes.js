import express from "express";
import {
  downloadStudentReportCardPDF,
  downloadMyReportCardPDF,
  downloadSubjectAttendancePDF,
  downloadSubjectAttendanceExcel,
  downloadExaminationResultsExcel,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { param } from "express-validator";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

// All report routes require authentication
router.use(protect);

// ── PDF ENDPOINTS ────────────────────────────────────────────────────────────
router.get(
  "/pdf/my-report-card",
  authorize("student"),
  downloadMyReportCardPDF
);

router.get(
  "/pdf/student/:studentId",
  authorize("admin", "hod", "faculty", "student"),
  param("studentId").isMongoId().withMessage("Invalid student ID"),
  validate,
  downloadStudentReportCardPDF
);

router.get(
  "/pdf/subject/:subjectId/attendance",
  authorize("admin", "hod", "faculty"),
  param("subjectId").isMongoId().withMessage("Invalid subject ID"),
  validate,
  downloadSubjectAttendancePDF
);

// ── EXCEL ENDPOINTS ──────────────────────────────────────────────────────────
router.get(
  "/excel/subject/:subjectId/attendance",
  authorize("admin", "hod", "faculty"),
  param("subjectId").isMongoId().withMessage("Invalid subject ID"),
  validate,
  downloadSubjectAttendanceExcel
);

router.get(
  "/excel/examination/:examId/results",
  authorize("admin", "hod", "faculty"),
  param("examId").isMongoId().withMessage("Invalid examination ID"),
  validate,
  downloadExaminationResultsExcel
);

export default router;

