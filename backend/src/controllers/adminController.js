import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import AcademicSession from "../models/AcademicSession.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { createStudentUser, createFacultyUser } from "../services/userService.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

/**
 * ADMIN CONTROLLER
 *
 * All operations here are restricted to the "admin" role.
 * The route file applies: protect + authorize("admin")
 *
 * Responsibilities:
 * - Create student and faculty accounts
 * - List and search users
 * - Activate / deactivate accounts
 * - Manage departments and academic sessions (Phase 6)
 */

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/students
// Create a new student account + profile
// ─────────────────────────────────────────────────────────────────────────────
export const createStudent = async (req, res, next) => {
  try {
    const student = await createStudentUser(req.body);

    res.status(201).json(
      new ApiResponse(201, "Student account created successfully.", { student })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/faculty
// Create a new faculty / HOD account + profile
// ─────────────────────────────────────────────────────────────────────────────
export const createFaculty = async (req, res, next) => {
  try {
    const faculty = await createFacultyUser(req.body);

    res.status(201).json(
      new ApiResponse(201, "Faculty account created successfully.", { faculty })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users
// List all users with search, role filter, and pagination
//
// Query params:
//   ?page=1&limit=10&search=john&role=student&isActive=true
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, role, isActive } = req.query;

    // Build dynamic filter object
    const filter = {};

    if (role && ["admin", "hod", "faculty", "student"].includes(role)) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Text search on name and email using a regex (case-insensitive)
    if (search && search.trim()) {
      filter.$or = [
        { name:  { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken -passwordResetToken -passwordResetExpires -passwordChangedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Users fetched successfully.", {
        users,
        pagination: buildPaginationMeta(page, limit, total),
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/students
// List all students with department filter and search
//
// Query params: ?page=1&limit=10&search=ravi&departmentId=xxx&semester=3&status=active
// ─────────────────────────────────────────────────────────────────────────────
export const getAllStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, departmentId, semester, status } = req.query;

    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (semester)     filter.currentSemester = parseInt(semester);
    if (status)       filter.status = status;

    // If a search term is provided, first find matching User IDs, then filter Students
    let userIdFilter;
    if (search && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name:  { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ],
        role: "student",
      }).select("_id");
      userIdFilter = matchingUsers.map((u) => u._id);
      filter.userId = { $in: userIdFilter };
    }

    // Also search by rollNumber and enrollmentNumber directly
    if (search && search.trim()) {
      delete filter.userId; // remove the userId filter
      filter.$or = [
        { rollNumber:        { $regex: search.trim(), $options: "i" } },
        { enrollmentNumber:  { $regex: search.trim(), $options: "i" } },
        ...(userIdFilter ? [{ userId: { $in: userIdFilter } }] : []),
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate("userId", "name email isActive createdAt")
        .populate("departmentId", "name code")
        .populate("admissionSessionId", "label")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Students fetched successfully.", {
        students,
        pagination: buildPaginationMeta(page, limit, total),
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/faculty
// List all faculty members
//
// Query params: ?page=1&limit=10&search=meena&departmentId=xxx&designation=Lecturer
// ─────────────────────────────────────────────────────────────────────────────
export const getAllFaculty = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, departmentId, designation } = req.query;

    const filter = {};
    if (departmentId)  filter.departmentId = departmentId;
    if (designation)   filter.designation  = designation;

    if (search && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name:  { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ],
        role: { $in: ["faculty", "hod"] },
      }).select("_id");

      filter.$or = [
        { employeeId: { $regex: search.trim(), $options: "i" } },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const [facultyList, total] = await Promise.all([
      Faculty.find(filter)
        .populate("userId", "name email role isActive createdAt")
        .populate("departmentId", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Faculty.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Faculty fetched successfully.", {
        faculty: facultyList,
        pagination: buildPaginationMeta(page, limit, total),
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:userId/toggle-status
// Activate or deactivate any user account
// ─────────────────────────────────────────────────────────────────────────────
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deactivating their own account
    if (userId === req.user._id.toString()) {
      return next(
        new ApiError(400, "You cannot deactivate your own account.")
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    user.isActive = !user.isActive;
    // When deactivating, also revoke all active sessions
    if (!user.isActive) {
      user.refreshToken = undefined;
    }
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
      new ApiResponse(
        200,
        `User account ${user.isActive ? "activated" : "deactivated"} successfully.`,
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/users/:userId
// Get full details of any user (including their student/faculty profile)
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-password -refreshToken -passwordResetToken -passwordResetExpires -passwordChangedAt"
    );
    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    // Load role-specific profile
    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id })
        .populate("departmentId", "name code")
        .populate("admissionSessionId", "label");
    } else if (user.role === "faculty" || user.role === "hod") {
      profile = await Faculty.findOne({ userId: user._id })
        .populate("departmentId", "name code")
        .populate("subjects", "name code semester");
    }

    res.status(200).json(
      new ApiResponse(200, "User details fetched successfully.", {
        user,
        profile,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/students/:studentId
// Admin updates a student's academic profile (semester, status, department)
// ─────────────────────────────────────────────────────────────────────────────
export const updateStudentProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Only allow changing specific administrative fields
    const allowedUpdates = ["currentSemester", "status", "departmentId"];
    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return next(new ApiError(400, "No valid fields provided for update."));
    }

    const student = await Student.findByIdAndUpdate(studentId, updates, {
      new: true,         // Return the updated document
      runValidators: true, // Run schema validators on the update
    })
      .populate("userId", "name email role isActive")
      .populate("departmentId", "name code");

    if (!student) {
      return next(new ApiError(404, "Student not found."));
    }

    res.status(200).json(
      new ApiResponse(200, "Student profile updated successfully.", { student })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (soft) — Handled by toggleUserStatus above.
// We never hard-delete users to preserve historical records (attendance, marks).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/departments
// List all departments
// ─────────────────────────────────────────────────────────────────────────────
export const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate("hod", "employeeId designation")
      .sort({ name: 1 });

    res.status(200).json(
      new ApiResponse(200, "Departments fetched successfully.", { departments })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/departments
// Create a new department
// ─────────────────────────────────────────────────────────────────────────────
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const department = await Department.create({ name, code, description });

    res.status(201).json(
      new ApiResponse(201, "Department created successfully.", { department })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/sessions
// List all academic sessions
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSessions = async (req, res, next) => {
  try {
    const sessions = await AcademicSession.find().sort({ startDate: -1 });

    res.status(200).json(
      new ApiResponse(200, "Academic sessions fetched successfully.", { sessions })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/admin/sessions
// Create a new academic session
// ─────────────────────────────────────────────────────────────────────────────
export const createSession = async (req, res, next) => {
  try {
    const {
      label,
      name,
      startDate,
      endDate,
      isCurrent,
      isEnrollmentOpen,
      enrollmentStartDate,
      enrollmentEndDate,
    } = req.body;

    const session = await AcademicSession.create({
      label: label || name,
      startDate,
      endDate,
      isCurrent: isCurrent || false,
      isEnrollmentOpen: isEnrollmentOpen || false,
      enrollmentStartDate: enrollmentStartDate || null,
      enrollmentEndDate: enrollmentEndDate || null,
    });

    res.status(201).json(
      new ApiResponse(201, "Academic session created successfully.", { session })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/sessions/:sessionId/enrollment-window
// Set enrollment timeline / open/close registration for students
// ─────────────────────────────────────────────────────────────────────────────
export const updateEnrollmentWindow = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { isEnrollmentOpen, enrollmentStartDate, enrollmentEndDate } = req.body;

    const session = await AcademicSession.findById(sessionId);
    if (!session) throw new ApiError(404, "Academic session not found.");

    if (isEnrollmentOpen !== undefined) session.isEnrollmentOpen = Boolean(isEnrollmentOpen);
    if (enrollmentStartDate !== undefined) session.enrollmentStartDate = enrollmentStartDate;
    if (enrollmentEndDate !== undefined) session.enrollmentEndDate = enrollmentEndDate;

    await session.save();

    res.status(200).json(
      new ApiResponse(200, "Enrollment window timeline updated successfully.", { session })
    );
  } catch (error) {
    next(error);
  }
};


