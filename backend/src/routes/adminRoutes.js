import express from "express";
import {
  createStudent,
  createFaculty,
  getAllUsers,
  getAllStudents,
  getAllFaculty,
  toggleUserStatus,
  getUserById,
  updateStudentProfile,
  getAllDepartments,
  createDepartment,
  getAllSessions,
  createSession,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createStudentValidation,
  createFacultyValidation,
  createDepartmentValidation,
  createSessionValidation,
  validate,
} from "../middleware/validateMiddleware.js";

const router = express.Router();

// All admin routes require authentication + admin role
// Apply both middleware globally to this router
router.use(protect, authorize("admin"));

// ── USER MANAGEMENT ──────────────────────────────────────────────────────────
router.get("/users",                        getAllUsers);
router.get("/users/:userId",                getUserById);
router.patch("/users/:userId/toggle-status", toggleUserStatus);

// ── STUDENT MANAGEMENT ───────────────────────────────────────────────────────
router.post("/students",   createStudentValidation, validate, createStudent);
router.get("/students",    getAllStudents);
router.patch("/students/:studentId", updateStudentProfile);

// ── FACULTY MANAGEMENT ───────────────────────────────────────────────────────
router.post("/faculty",    createFacultyValidation, validate, createFaculty);
router.get("/faculty",     getAllFaculty);

// ── DEPARTMENT MANAGEMENT ─────────────────────────────────────────────────────
router.get("/departments",    getAllDepartments);
router.post("/departments",   createDepartmentValidation, validate, createDepartment);

// ── ACADEMIC SESSION MANAGEMENT ───────────────────────────────────────────────
router.get("/sessions",    getAllSessions);
router.post("/sessions",   createSessionValidation, validate, createSession);

export default router;

