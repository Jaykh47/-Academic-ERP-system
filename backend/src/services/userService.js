import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import AcademicSession from "../models/AcademicSession.js";
import Subject from "../models/Subject.js"; // register schema for populate
import ApiError from "../utils/ApiError.js";

/**
 * USER SERVICE
 *
 * This service layer handles the complex business logic for user creation.
 * Controllers call these functions instead of talking directly to models,
 * keeping controllers clean and logic reusable.
 *
 * WHY A SERVICE LAYER HERE?
 * Creating a student requires:
 *  1. Validating that the department exists.
 *  2. Validating that the academic session exists.
 *  3. Creating a User document (authentication).
 *  4. Creating a Student document (profile).
 *  5. If step 4 fails, rolling back step 3 (manual atomicity).
 *
 * That's too much logic for a controller. It belongs in a service.
 *
 * NOTE ON TRANSACTIONS:
 * MongoDB transactions require a replica set. For local development
 * with a standalone mongod instance, we use manual rollback instead:
 *   - Create User first
 *   - Attempt to create Student
 *   - If Student creation fails → delete the User we just created
 *
 * To enable full transaction support, run MongoDB as a replica set:
 *   mongod --replSet rs0
 *   Then in mongosh: rs.initiate()
 */

// ─────────────────────────────────────────────────────────────────────────────
// CREATE STUDENT USER
// ─────────────────────────────────────────────────────────────────────────────
export const createStudentUser = async (data) => {
  const {
    name,
    email,
    password,
    rollNumber,
    enrollmentNumber,
    departmentId,
    admissionSessionId,
    admissionYear,
    currentSemester,
    dateOfBirth,
    phone,
    guardianName,
    guardianPhone,
    address,
  } = data;

  // ── Prerequisite Checks ───────────────────────────────────────────────────

  // 1. Verify department exists and is active
  const department = await Department.findOne({ _id: departmentId, isActive: true });
  if (!department) {
    throw new ApiError(404, `Department not found or is inactive.`);
  }

  // 2. Verify academic session exists
  const session = await AcademicSession.findOne({ _id: admissionSessionId, isActive: true });
  if (!session) {
    throw new ApiError(404, `Academic session not found or is inactive.`);
  }

  // 3. Check if email is already registered (Mongoose will also catch this,
  //    but we give a clearer message up front)
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new ApiError(409, `A user with email '${email}' already exists.`);
  }

  // ── Create User (authentication document) ────────────────────────────────
  let newUser;
  try {
    newUser = await User.create({ name, email, password, role: "student" });
  } catch (error) {
    // Let the global error handler convert duplicate key errors (code 11000)
    throw error;
  }

  // ── Create Student profile ────────────────────────────────────────────────
  let newStudent;
  try {
    newStudent = await Student.create({
      userId: newUser._id,
      rollNumber,
      enrollmentNumber,
      departmentId,
      admissionSessionId,
      admissionYear,
      currentSemester,
      ...(dateOfBirth && { dateOfBirth }),
      ...(phone && { phone }),
      ...(guardianName && { guardianName }),
      ...(guardianPhone && { guardianPhone }),
      ...(address && { address }),
    });
  } catch (error) {
    // MANUAL ROLLBACK: Student creation failed — delete the User we just created
    // so we don't leave an orphaned User with no profile.
    await User.findByIdAndDelete(newUser._id);
    throw error; // re-throw so the controller/error handler deals with it
  }

  // ── Return populated result ───────────────────────────────────────────────
  const result = await Student.findById(newStudent._id)
    .populate("userId", "name email role isActive createdAt")
    .populate("departmentId", "name code")
    .populate("admissionSessionId", "label");

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FACULTY USER
// ─────────────────────────────────────────────────────────────────────────────
export const createFacultyUser = async (data) => {
  const {
    name,
    email,
    password,
    role, // "faculty" or "hod"
    employeeId,
    departmentId,
    designation,
    phone,
    qualification,
    joiningDate,
  } = data;

  // ── Prerequisite Checks ───────────────────────────────────────────────────

  const department = await Department.findOne({ _id: departmentId, isActive: true });
  if (!department) {
    throw new ApiError(404, `Department not found or is inactive.`);
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new ApiError(409, `A user with email '${email}' already exists.`);
  }

  const empExists = await Faculty.findOne({ employeeId: employeeId.toUpperCase() });
  if (empExists) {
    throw new ApiError(409, `Employee ID '${employeeId}' is already registered.`);
  }

  // If the new faculty member will be HOD, enforce one-HOD-per-department rule
  if (role === "hod") {
    const existingHod = await Department.findOne({
      _id: departmentId,
      hod: { $ne: null },
    });
    if (existingHod) {
      throw new ApiError(
        409,
        `Department '${department.name}' already has an assigned HOD. Please remove the existing HOD first.`
      );
    }
  }

  // ── Create User ───────────────────────────────────────────────────────────
  let newUser;
  try {
    newUser = await User.create({ name, email, password, role });
  } catch (error) {
    throw error;
  }

  // ── Create Faculty profile ─────────────────────────────────────────────────
  let newFaculty;
  try {
    newFaculty = await Faculty.create({
      userId: newUser._id,
      employeeId,
      departmentId,
      designation,
      ...(phone && { phone }),
      ...(qualification && { qualification }),
      ...(joiningDate && { joiningDate }),
    });

    // If the new faculty is designated as HOD, update the Department
    if (role === "hod") {
      await Department.findByIdAndUpdate(departmentId, { hod: newFaculty._id });
    }
  } catch (error) {
    // Manual rollback
    await User.findByIdAndDelete(newUser._id);
    throw error;
  }

  // ── Return populated result ───────────────────────────────────────────────
  const result = await Faculty.findById(newFaculty._id)
    .populate("userId", "name email role isActive createdAt")
    .populate("departmentId", "name code");

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET STUDENT PROFILE (with full population)
// Used by: student (own profile), admin, hod, faculty
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentProfile = async (studentId) => {
  const student = await Student.findById(studentId)
    .populate("userId", "name email role isActive createdAt updatedAt")
    .populate("departmentId", "name code")
    .populate("admissionSessionId", "label startDate endDate");

  if (!student) {
    throw new ApiError(404, "Student profile not found.");
  }
  return student;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET FACULTY PROFILE (with full population)
// ─────────────────────────────────────────────────────────────────────────────
export const getFacultyProfile = async (facultyId) => {
  const faculty = await Faculty.findById(facultyId)
    .populate("userId", "name email role isActive createdAt updatedAt")
    .populate("departmentId", "name code")
    .populate("subjects", "name code semester");

  if (!faculty) {
    throw new ApiError(404, "Faculty profile not found.");
  }
  return faculty;
};
