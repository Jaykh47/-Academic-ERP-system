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
} from "../controllers/academicController.js";
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

export default router;

