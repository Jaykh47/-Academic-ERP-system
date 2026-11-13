import Faculty from "../models/Faculty.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js"; // must be imported to register schema for populate
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getFacultyProfile } from "../services/userService.js";

/**
 * FACULTY CONTROLLER
 *
 * Handles faculty-facing profile operations.
 * Subject assignment happens in Phase 6 (Academic Management).
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/faculty/profile
// Faculty / HOD views their own profile
// Role: faculty, hod
// ─────────────────────────────────────────────────────────────────────────────
export const getMyFacultyProfile = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id })
      .populate("userId", "name email role isActive createdAt")
      .populate("departmentId", "name code")
      .populate("subjects", "name code semester subjectType");

    if (!faculty) {
      return next(
        new ApiError(404, "Faculty profile not found. Please contact the administrator.")
      );
    }

    res.status(200).json(
      new ApiResponse(200, "Profile fetched successfully.", { faculty })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/faculty/profile
// Faculty updates their own personal details
// Role: faculty, hod
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyFacultyProfile = async (req, res, next) => {
  try {
    // Faculty can update personal details but NOT department, employeeId, or designation
    // (those are admin-controlled)
    const allowedFields = ["phone", "qualification", "joiningDate"];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0 && !req.body.name) {
      return next(
        new ApiError(400, "No valid fields provided. You can update: phone, qualification, joiningDate, or your name.")
      );
    }

    const faculty = await Faculty.findOneAndUpdate(
      { userId: req.user._id }, // resource-level: only their own profile
      updates,
      { new: true, runValidators: true }
    )
      .populate("userId", "name email role isActive")
      .populate("departmentId", "name code");

    if (!faculty) {
      return next(new ApiError(404, "Faculty profile not found."));
    }

    // Allow name update on User document
    if (req.body.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.name.trim() });
    }

    res.status(200).json(
      new ApiResponse(200, "Profile updated successfully.", { faculty })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/faculty/:facultyId
// View a specific faculty member's profile
// Role: admin, hod
// ─────────────────────────────────────────────────────────────────────────────
export const getFacultyById = async (req, res, next) => {
  try {
    const { facultyId } = req.params;

    const faculty = await getFacultyProfile(facultyId);

    // HOD can only view faculty within their own department
    if (req.user.role === "hod") {
      const hodProfile = await Faculty.findOne({ userId: req.user._id });
      if (!hodProfile) {
        return next(new ApiError(404, "HOD profile not found."));
      }
      if (faculty.departmentId._id.toString() !== hodProfile.departmentId.toString()) {
        return next(
          new ApiError(403, "Access denied. You can only view faculty within your department.")
        );
      }
    }

    res.status(200).json(
      new ApiResponse(200, "Faculty profile fetched successfully.", { faculty })
    );
  } catch (error) {
    next(error);
  }
};
