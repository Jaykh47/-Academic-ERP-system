import express from "express";
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All student routes require authentication
router.use(protect);

// ── STUDENT'S OWN PROFILE ─────────────────────────────────────────────────────
// Only a "student" can access their own profile this way
router.get("/profile",   authorize("student"), getMyStudentProfile);
router.patch("/profile", authorize("student"), updateMyStudentProfile);

// ── VIEW A SPECIFIC STUDENT ───────────────────────────────────────────────────
// Admin, HOD, Faculty can view any student.
// Students can view their own profile too (resource check is inside controller).
router.get(
  "/:studentId",
  authorize("admin", "hod", "faculty", "student"),
  getStudentById
);

export default router;

