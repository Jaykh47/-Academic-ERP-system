import express from "express";
import {
  getMyFacultyProfile,
  updateMyFacultyProfile,
  getFacultyById,
} from "../controllers/facultyController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// ── FACULTY'S OWN PROFILE ─────────────────────────────────────────────────────
router.get("/profile",   authorize("faculty", "hod"), getMyFacultyProfile);
router.patch("/profile", authorize("faculty", "hod"), updateMyFacultyProfile);

// ── VIEW A SPECIFIC FACULTY MEMBER ────────────────────────────────────────────
// Admin and HOD can view any faculty member.
// Department restriction for HOD is enforced inside the controller.
router.get("/:facultyId", authorize("admin", "hod"), getFacultyById);

export default router;

