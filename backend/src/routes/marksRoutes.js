import express from "express";
import {
  createExamination,
  getExaminations,
  getExaminationById,
  lockExamination,
  submitMarks,
  updateSingleMarks,
  getExaminationResults,
  getStudentSemesterReport,
  getMySemesterReport,
  getStudentPerformance,
  getMyPerformance,
} from "../controllers/marksController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createExaminationValidation,
  submitMarksValidation,
  updateSingleMarksValidation,
  validate,
} from "../middleware/validateMiddleware.js";

const router = express.Router();

// All marks/examination routes require authentication
router.use(protect);

// ── EXAMINATIONS ─────────────────────────────────────────────────────────────
router.post(
  "/examinations",
  authorize("admin", "hod", "faculty"),
  createExaminationValidation,
  validate,
  createExamination
);

router.get(
  "/examinations",
  authorize("admin", "hod", "faculty", "student"),
  getExaminations
);

router.get(
  "/examinations/:examId",
  authorize("admin", "hod", "faculty", "student"),
  getExaminationById
);

router.get(
  "/examinations/:examId/results",
  authorize("admin", "hod", "faculty"),
  getExaminationResults
);

router.patch(
  "/examinations/:examId/lock",
  authorize("admin", "hod", "faculty"),
  lockExamination
);

// ── MARKS UPLOAD & AUDIT ─────────────────────────────────────────────────────
router.post(
  "/submit",
  authorize("admin", "hod", "faculty"),
  submitMarksValidation,
  validate,
  submitMarks
);

router.patch(
  "/:marksId",
  authorize("admin", "hod", "faculty"),
  updateSingleMarksValidation,
  validate,
  updateSingleMarks
);

// ── SEMESTER REPORT CARDS ────────────────────────────────────────────────────
router.get(
  "/my-performance",
  authorize("student"),
  getMyPerformance
);

router.get(
  "/student/:studentId/performance",
  authorize("admin", "hod", "faculty", "student"),
  getStudentPerformance
);

router.get(
  "/report/my-report",
  authorize("student"),
  getMySemesterReport
);

router.get(
  "/report/student/:studentId",
  authorize("admin", "hod", "faculty", "student"),
  getStudentSemesterReport
);

export default router;

