import { validationResult, body, param, query } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * VALIDATION MIDDLEWARE
 *
 * We use express-validator to validate incoming request data before it
 * reaches the controller. This follows the principle: garbage in, garbage out.
 * Validate early, fail fast.
 *
 * How it works:
 * 1. We define "validation chains" — arrays of rules for each field.
 * 2. We export a `validate` runner that checks those rules and
 *    returns a 422 error with field-level messages if any rule fails.
 * 3. Routes use them like middleware: [loginValidation, validate, controller]
 *
 * The `validate` function is always the LAST item before the controller.
 * The validation chains run first and populate the error list.
 * `validate` then checks that list and either blocks or passes the request.
 */

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE RUNNER
// Reads the error list that express-validator populated and throws if any exist.
// ─────────────────────────────────────────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Map express-validator errors to our standard format
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(422, "Validation failed", formattedErrors));
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH VALIDATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword")
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (value && value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("password")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  param("token")
    .notEmpty().withMessage("Reset token is required"),
];

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT VALIDATIONS (used in Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export const createUserValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["admin", "hod", "faculty", "student"])
    .withMessage("Role must be one of: admin, hod, faculty, student"),
];


// ─────────────────────────────────────────────────────────────────────────────
// STUDENT CREATION VALIDATION (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createStudentValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("rollNumber")
    .trim()
    .notEmpty().withMessage("Roll number is required")
    .isLength({ max: 20 }).withMessage("Roll number must not exceed 20 characters"),

  body("enrollmentNumber")
    .trim()
    .notEmpty().withMessage("Enrollment number is required"),

  body("departmentId")
    .notEmpty().withMessage("Department is required")
    .isMongoId().withMessage("Invalid department ID"),

  body("admissionSessionId")
    .notEmpty().withMessage("Admission session is required")
    .isMongoId().withMessage("Invalid academic session ID"),

  body("admissionYear")
    .notEmpty().withMessage("Admission year is required")
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage("Please provide a valid admission year"),

  body("currentSemester")
    .notEmpty().withMessage("Current semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),

  body("phone")
    .optional()
    .matches(/^[0-9]{10}$/).withMessage("Phone number must be exactly 10 digits"),

  body("guardianPhone")
    .optional()
    .matches(/^[0-9]{10}$/).withMessage("Guardian phone must be exactly 10 digits"),

  body("dateOfBirth")
    .optional()
    .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),
];

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY CREATION VALIDATION (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createFacultyValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["faculty", "hod"]).withMessage("Role must be either 'faculty' or 'hod'"),

  body("employeeId")
    .trim()
    .notEmpty().withMessage("Employee ID is required"),

  body("departmentId")
    .notEmpty().withMessage("Department is required")
    .isMongoId().withMessage("Invalid department ID"),

  body("designation")
    .notEmpty().withMessage("Designation is required")
    .isIn(["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab Instructor", "Guest Faculty"])
    .withMessage("Invalid designation"),

  body("phone")
    .optional()
    .matches(/^[0-9]{10}$/).withMessage("Phone number must be exactly 10 digits"),

  body("joiningDate")
    .optional()
    .isISO8601().withMessage("Joining date must be a valid date (YYYY-MM-DD)"),
];

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT CREATION VALIDATION (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createDepartmentValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Department name is required")
    .isLength({ max: 100 }).withMessage("Department name must not exceed 100 characters"),

  body("code")
    .trim()
    .notEmpty().withMessage("Department code is required")
    .isLength({ max: 10 }).withMessage("Department code must not exceed 10 characters")
    .matches(/^[A-Za-z0-9]+$/).withMessage("Department code must contain only letters and numbers"),

  body("description")
    .optional()
    .isLength({ max: 500 }).withMessage("Description must not exceed 500 characters"),
];

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC SESSION CREATION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const createSessionValidation = [
  body("label")
    .trim()
    .notEmpty().withMessage("Session label is required")
    .matches(/^\d{4}-\d{4}$/).withMessage("Session label must follow YYYY-YYYY format (e.g. 2024-2025)"),

  body("startDate")
    .notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("Start date must be a valid date"),

  body("endDate")
    .notEmpty().withMessage("End date is required")
    .isISO8601().withMessage("End date must be a valid date"),

  body("isCurrent")
    .optional()
    .isBoolean().withMessage("isCurrent must be true or false"),
];

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT CREATION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const createSubjectValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Subject name is required")
    .isLength({ max: 150 }).withMessage("Subject name must not exceed 150 characters"),

  body("code")
    .trim()
    .notEmpty().withMessage("Subject code is required")
    .isLength({ max: 20 }).withMessage("Subject code must not exceed 20 characters")
    .matches(/^[A-Za-z0-9_-]+$/).withMessage("Subject code can only contain letters, numbers, hyphens, and underscores"),

  body("departmentId")
    .notEmpty().withMessage("Department is required")
    .isMongoId().withMessage("Invalid department ID"),

  body("semester")
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),

  body("credits")
    .notEmpty().withMessage("Credits are required")
    .isInt({ min: 1, max: 6 }).withMessage("Credits must be between 1 and 6"),

  body("subjectType")
    .optional()
    .isIn(["theory", "practical", "project", "seminar"])
    .withMessage("Subject type must be theory, practical, project, or seminar"),

  body("assignedFaculty")
    .optional()
    .isMongoId().withMessage("Invalid faculty ID"),

  body("description")
    .optional()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY ASSIGNMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const assignFacultyValidation = [
  param("subjectId")
    .isMongoId().withMessage("Invalid subject ID"),

  body("facultyId")
    .notEmpty().withMessage("Faculty ID is required")
    .isMongoId().withMessage("Invalid faculty ID"),
];

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE ENROLLMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const enrollStudentValidation = [
  body("studentId")
    .notEmpty().withMessage("Student ID is required")
    .isMongoId().withMessage("Invalid student ID"),

  body("subjectId")
    .notEmpty().withMessage("Subject ID is required")
    .isMongoId().withMessage("Invalid subject ID"),

  body("academicSessionId")
    .notEmpty().withMessage("Academic session ID is required")
    .isMongoId().withMessage("Invalid academic session ID"),

  body("semester")
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),
];

// ─────────────────────────────────────────────────────────────────────────────
// BATCH ENROLLMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export const batchEnrollValidation = [
  body("departmentId")
    .notEmpty().withMessage("Department ID is required")
    .isMongoId().withMessage("Invalid department ID"),

  body("semester")
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),

  body("academicSessionId")
    .notEmpty().withMessage("Academic session ID is required")
    .isMongoId().withMessage("Invalid academic session ID"),
];

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE VALIDATIONS (PHASE 7)
// ─────────────────────────────────────────────────────────────────────────────

export const createClassSessionValidation = [
  body("subjectId")
    .notEmpty().withMessage("Subject ID is required")
    .isMongoId().withMessage("Invalid subject ID"),

  body("academicSessionId")
    .notEmpty().withMessage("Academic session ID is required")
    .isMongoId().withMessage("Invalid academic session ID"),

  body("date")
    .notEmpty().withMessage("Class date is required")
    .isISO8601().withMessage("Class date must be a valid ISO date (YYYY-MM-DD)"),

  body("startTime")
    .notEmpty().withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Start time must be HH:MM format"),

  body("endTime")
    .notEmpty().withMessage("End time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("End time must be HH:MM format"),

  body("sessionType")
    .optional()
    .isIn(["lecture", "practical", "tutorial", "extra"])
    .withMessage("Session type must be lecture, practical, tutorial, or extra"),

  body("topic")
    .optional()
    .isLength({ max: 300 }).withMessage("Topic cannot exceed 300 characters"),

  body("room")
    .optional()
    .isLength({ max: 50 }).withMessage("Room cannot exceed 50 characters"),
];

export const submitAttendanceValidation = [
  body("classSessionId")
    .notEmpty().withMessage("Class session ID is required")
    .isMongoId().withMessage("Invalid class session ID"),

  body("records")
    .isArray({ min: 1 }).withMessage("Records array cannot be empty"),

  body("records.*.studentId")
    .notEmpty().withMessage("Student ID is required for each record")
    .isMongoId().withMessage("Invalid student ID in records"),

  body("records.*.status")
    .notEmpty().withMessage("Status is required for each record")
    .isIn(["present", "absent", "late"]).withMessage("Status must be present, absent, or late"),

  body("records.*.remarks")
    .optional()
    .isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
];

export const correctAttendanceValidation = [
  param("attendanceId")
    .isMongoId().withMessage("Invalid attendance record ID"),

  body("status")
    .notEmpty().withMessage("Updated status is required")
    .isIn(["present", "absent", "late"]).withMessage("Status must be present, absent, or late"),

  body("remarks")
    .optional()
    .isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAMINATION & MARKS VALIDATIONS (PHASE 8)
// ─────────────────────────────────────────────────────────────────────────────

export const createExaminationValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Examination name is required")
    .isLength({ max: 150 }).withMessage("Examination name cannot exceed 150 characters"),

  body("examType")
    .notEmpty().withMessage("Exam type is required")
    .isIn(["internal_test", "assignment", "practical", "project", "semester", "quiz", "viva"])
    .withMessage("Invalid exam type"),

  body("subjectId")
    .notEmpty().withMessage("Subject ID is required")
    .isMongoId().withMessage("Invalid subject ID"),

  body("academicSessionId")
    .notEmpty().withMessage("Academic session ID is required")
    .isMongoId().withMessage("Invalid academic session ID"),

  body("semester")
    .notEmpty().withMessage("Semester is required")
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),

  body("maximumMarks")
    .notEmpty().withMessage("Maximum marks are required")
    .isFloat({ min: 1, max: 200 }).withMessage("Maximum marks must be between 1 and 200"),

  body("passMarks")
    .notEmpty().withMessage("Pass marks are required")
    .isFloat({ min: 0 }).withMessage("Pass marks cannot be negative")
    .custom((value, { req }) => {
      if (parseFloat(value) > parseFloat(req.body.maximumMarks)) {
        throw new Error("Pass marks cannot exceed maximum marks");
      }
      return true;
    }),

  body("weightage")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Weightage must be between 0 and 100"),

  body("examDate")
    .optional()
    .isISO8601().withMessage("Exam date must be a valid ISO date"),

  body("description")
    .optional()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

export const submitMarksValidation = [
  body("examinationId")
    .notEmpty().withMessage("Examination ID is required")
    .isMongoId().withMessage("Invalid examination ID"),

  body("marks")
    .isArray({ min: 1 }).withMessage("Marks array must contain at least one record"),

  body("marks.*.studentId")
    .notEmpty().withMessage("Student ID is required for each record")
    .isMongoId().withMessage("Invalid student ID in marks list"),

  body("marks.*.obtainedMarks")
    .notEmpty().withMessage("Obtained marks are required")
    .isFloat({ min: 0 }).withMessage("Obtained marks cannot be negative"),

  body("marks.*.isAbsent")
    .optional()
    .isBoolean().withMessage("isAbsent must be true or false"),

  body("marks.*.remarks")
    .optional()
    .isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
];

export const updateSingleMarksValidation = [
  param("marksId")
    .isMongoId().withMessage("Invalid marks ID"),

  body("obtainedMarks")
    .optional()
    .isFloat({ min: 0 }).withMessage("Obtained marks cannot be negative"),

  body("isAbsent")
    .optional()
    .isBoolean().withMessage("isAbsent must be true or false"),

  body("remarks")
    .optional()
    .isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
];
