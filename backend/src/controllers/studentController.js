import Student from "../models/Student.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getStudentProfile } from "../services/userService.js";

/**
 * STUDENT CONTROLLER
 *
 * Handles student-facing operations:
 * - A student can view and update their OWN profile.
 * - Admin, HOD, and Faculty can view any student's profile.
 *
 * Resource-Level Authorization:
 * - GET /students/profile   → only the logged-in student's own data
 * - GET /students/:id       → open to admin/hod/faculty, and to the student themselves
 * - PATCH /students/profile → student can only change personal details (not semester/status)
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/students/profile
// Student views their own complete profile
// Role: student only
// ─────────────────────────────────────────────────────────────────────────────
export const getMyStudentProfile = async (req, res, next) => {
  try {
    // req.user is set by protect middleware. Find the student profile linked to this user.
    const student = await Student.findOne({ userId: req.user._id })
      .populate("userId", "name email role isActive createdAt")
      .populate("departmentId", "name code")
      .populate("admissionSessionId", "label startDate endDate");

    if (!student) {
      return next(
        new ApiError(404, "Student profile not found. Please contact the administrator.")
      );
    }

    res.status(200).json(
      new ApiResponse(200, "Profile fetched successfully.", { student })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/students/profile
// Student updates their own personal details
// Role: student only
//
// A student can only update personal fields.
// Academic fields (semester, status, department) are admin-only.
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyStudentProfile = async (req, res, next) => {
  try {
    // Whitelist of fields a student is allowed to change
    const allowedFields = ["phone", "address", "guardianName", "guardianPhone", "dateOfBirth"];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return next(
        new ApiError(400, "No valid fields provided. You can update: phone, address, guardianName, guardianPhone, dateOfBirth.")
      );
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id }, // ensures they can only update THEIR OWN profile
      updates,
      { new: true, runValidators: true }
    )
      .populate("userId", "name email role isActive")
      .populate("departmentId", "name code");

    if (!student) {
      return next(new ApiError(404, "Student profile not found."));
    }

    // Students can also update their name and avatar on the User document
    const userUpdates = {};
    if (req.body.name) userUpdates.name = req.body.name;
    if (req.body.avatar !== undefined) userUpdates.avatar = req.body.avatar;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    res.status(200).json(
      new ApiResponse(200, "Profile updated successfully.", { student })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/students/:studentId
// View a specific student's profile
// Role: admin, hod, faculty — AND the student themselves (resource check)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await getStudentProfile(studentId);

    // Resource-level authorization:
    // A student can only view their OWN profile via this endpoint.
    // Admin, HOD, Faculty can view any student's profile.
    if (
      req.user.role === "student" &&
      student.userId._id.toString() !== req.user._id.toString()
    ) {
      return next(
        new ApiError(403, "Access denied. You can only view your own profile.")
      );
    }

    res.status(200).json(
      new ApiResponse(200, "Student profile fetched successfully.", { student })
    );
  } catch (error) {
    next(error);
  }
};

