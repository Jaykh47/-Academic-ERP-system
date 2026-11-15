import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  assignFaculty,
  enrollSingleStudent,
  batchEnrollSemester,
  getEnrolledStudents,
  getMyEnrolledSubjects,
  getStudentEnrolledSubjects,
  getEnrollmentWindow,
  getAvailableSubjects,
  selfEnrollSubjects,
  selfDropSubject,
  getMyAssignedSubjects,
} from "../controllers/academicController.js";
import { getAllSessions } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createSubjectValidation,
  assignFacultyValidation,
  enrollStudentValidation,
  batchEnrollValidation,
  validate,
} from "../middleware/validateMiddleware.js";

const router = express.Router();

// All academic routes require authentication
router.use(protect);

// ── SUBJECTS ─────────────────────────────────────────────────────────────────
router.post(
  "/subjects",
  authorize("admin"),
  createSubjectValidation,
  validate,
  createSubject
);

router.get(
  "/subjects",
  authorize("admin", "hod", "faculty", "student"),
  getAllSubjects
);

router.get(
  "/subjects/:subjectId",
  authorize("admin", "hod", "faculty", "student"),
  getSubjectById
);

router.patch(
  "/subjects/:subjectId",
  authorize("admin"),
  updateSubject
);

router.post(
  "/subjects/:subjectId/assign-faculty",
  authorize("admin", "hod"),
  assignFacultyValidation,
  validate,
  assignFaculty
);

// ── ENROLLMENT ───────────────────────────────────────────────────────────────
router.post(
  "/enrollments",
  authorize("admin"),
  enrollStudentValidation,
  validate,
  enrollSingleStudent
);

router.post(
  "/enrollments/batch",
  authorize("admin"),
  batchEnrollValidation,
  validate,
  batchEnrollSemester
);

router.get(
  "/enrollments/subject/:subjectId",
  authorize("admin", "hod", "faculty"),
  getEnrolledStudents
);

router.get(
  "/enrollments/my-subjects",
  authorize("student"),
  getMyEnrolledSubjects
);

router.get(
  "/enrollments/student/:studentId",
  authorize("admin", "hod", "faculty"),
  getStudentEnrolledSubjects
);

// ── DIGICAMPUS COURSE REGISTRATION & TIMELINE ───────────────────────────────
router.get(
  "/enrollment-window",
  authorize("admin", "hod", "faculty", "student"),
  getEnrollmentWindow
);

router.get(
  "/sessions",
  authorize("admin", "hod", "faculty", "student"),
  getAllSessions
);

router.get(
  "/available-subjects",
  authorize("student"),
  getAvailableSubjects
);

router.post(
  "/enrollments/self",
  authorize("student"),
  selfEnrollSubjects
);

router.delete(
  "/enrollments/self/:subjectId",
  authorize("student"),
  selfDropSubject
);

router.get(
  "/my-assigned-subjects",
  authorize("admin", "hod", "faculty"),
  getMyAssignedSubjects
);

export default router;

