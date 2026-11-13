import {
  Subject,
  Department,
  Faculty,
  Student,
  AcademicSession,
  Enrollment,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * ACADEMIC SERVICE
 *
 * Encapsulates core academic domain logic:
 * - Subject creation and management
 * - Bidirectional faculty-subject assignment
 * - Individual and cohort/batch student enrollment
 */

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SUBJECT
// ─────────────────────────────────────────────────────────────────────────────
export const createSubjectService = async (data) => {
  const {
    name,
    code,
    departmentId,
    semester,
    credits,
    subjectType,
    assignedFaculty,
    description,
  } = data;

  // 1. Verify department exists and is active
  const department = await Department.findOne({ _id: departmentId, isActive: true });
  if (!department) {
    throw new ApiError(404, "Department not found or is inactive.");
  }

  // 2. Check duplicate subject code within this department
  const existingCode = await Subject.findOne({
    code: code.toUpperCase(),
    departmentId,
  });
  if (existingCode) {
    throw new ApiError(
      409,
      `Subject with code '${code.toUpperCase()}' already exists in ${department.name}.`
    );
  }

  // 3. If faculty is pre-assigned at creation, verify existence
  if (assignedFaculty) {
    const faculty = await Faculty.findById(assignedFaculty);
    if (!faculty) {
      throw new ApiError(404, "Assigned faculty member not found.");
    }
  }

  // 4. Create Subject
  const newSubject = await Subject.create({
    name,
    code: code.toUpperCase(),
    departmentId,
    semester,
    credits,
    subjectType: subjectType || "theory",
    assignedFaculty: assignedFaculty || null,
    description,
  });

  // 5. If faculty was assigned, update the faculty's subjects array
  if (assignedFaculty) {
    await Faculty.findByIdAndUpdate(assignedFaculty, {
      $addToSet: { subjects: newSubject._id },
    });
  }

  return await Subject.findById(newSubject._id)
    .populate("departmentId", "name code")
    .populate({
      path: "assignedFaculty",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN FACULTY TO SUBJECT (Bidirectional sync)
// ─────────────────────────────────────────────────────────────────────────────
export const assignFacultyToSubjectService = async (subjectId, facultyId, requestingUser) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found.");
  }

  const newFaculty = await Faculty.findById(facultyId).populate("userId", "name email");
  if (!newFaculty) {
    throw new ApiError(404, "Faculty member not found.");
  }

  // HOD Resource-level check: HOD can only assign faculty for their own department's subjects
  if (requestingUser.role === "hod") {
    const hodFaculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!hodFaculty || hodFaculty.departmentId.toString() !== subject.departmentId.toString()) {
      throw new ApiError(403, "HOD can only assign faculty to subjects within their department.");
    }
  }

  // If subject was previously assigned to a different faculty member, remove it from their subjects array
  if (subject.assignedFaculty && subject.assignedFaculty.toString() !== facultyId.toString()) {
    await Faculty.findByIdAndUpdate(subject.assignedFaculty, {
      $pull: { subjects: subject._id },
    });
  }

  // Update Subject with new faculty
  subject.assignedFaculty = facultyId;
  await subject.save();

  // Add subject to new faculty's subjects array ($addToSet prevents duplicates)
  await Faculty.findByIdAndUpdate(facultyId, {
    $addToSet: { subjects: subject._id },
  });

  return await Subject.findById(subject._id)
    .populate("departmentId", "name code")
    .populate({
      path: "assignedFaculty",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLL SINGLE STUDENT
// ─────────────────────────────────────────────────────────────────────────────
export const enrollStudentService = async (data) => {
  const { studentId, subjectId, academicSessionId, semester } = data;

  // Verify Student, Subject, and Session exist
  const [student, subject, session] = await Promise.all([
    Student.findById(studentId),
    Subject.findById(subjectId),
    AcademicSession.findById(academicSessionId),
  ]);

  if (!student) throw new ApiError(404, "Student not found.");
  if (!subject) throw new ApiError(404, "Subject not found.");
  if (!session) throw new ApiError(404, "Academic session not found.");

  // Check if enrollment already exists
  const existing = await Enrollment.findOne({
    studentId,
    subjectId,
    academicSessionId,
  });

  if (existing) {
    throw new ApiError(409, "Student is already enrolled in this subject for this session.");
  }

  const enrollment = await Enrollment.create({
    studentId,
    subjectId,
    academicSessionId,
    semester: semester || subject.semester,
    status: "active",
  });

  return await Enrollment.findById(enrollment._id)
    .populate({
      path: "studentId",
      select: "rollNumber enrollmentNumber userId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("subjectId", "name code semester credits")
    .populate("academicSessionId", "label");
};

// ─────────────────────────────────────────────────────────────────────────────
// BATCH/SEMESTER COHORT ENROLLMENT
// Enrolls all active students of a department & semester into all active subjects of that semester
// ─────────────────────────────────────────────────────────────────────────────
export const batchEnrollSemesterService = async ({ departmentId, semester, academicSessionId }) => {
  const [students, subjects, session] = await Promise.all([
    Student.find({ departmentId, currentSemester: semester, status: "active" }),
    Subject.find({ departmentId, semester, isActive: true }),
    AcademicSession.findById(academicSessionId),
  ]);

  if (!session) throw new ApiError(404, "Academic session not found.");
  if (!students.length) throw new ApiError(404, `No active students found in Semester ${semester}.`);
  if (!subjects.length) throw new ApiError(404, `No active subjects found for Semester ${semester}.`);

  let enrolledCount = 0;
  let skippedCount = 0;

  // Prepare batch operations
  const bulkOps = [];

  for (const student of students) {
    for (const subject of subjects) {
      bulkOps.push({
        updateOne: {
          filter: {
            studentId: student._id,
            subjectId: subject._id,
            academicSessionId,
          },
          update: {
            $setOnInsert: {
              studentId: student._id,
              subjectId: subject._id,
              academicSessionId,
              semester,
              status: "active",
              enrolledAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }
  }

  const bulkResult = await Enrollment.bulkWrite(bulkOps);

  enrolledCount = bulkResult.upsertedCount;
  skippedCount = bulkResult.matchedCount;

  return {
    totalStudents: students.length,
    totalSubjects: subjects.length,
    newlyEnrolledRecords: enrolledCount,
    previouslyEnrolledRecords: skippedCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ENROLLED STUDENTS FOR A SUBJECT
// ─────────────────────────────────────────────────────────────────────────────
export const getEnrolledStudentsForSubjectService = async (subjectId, academicSessionId) => {
  const filter = { subjectId, status: "active" };
  if (academicSessionId) filter.academicSessionId = academicSessionId;

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "studentId",
      select: "rollNumber enrollmentNumber currentSemester userId",
      populate: { path: "userId", select: "name email isActive" },
    })
    .populate("academicSessionId", "label")
    .sort({ "studentId.rollNumber": 1 });

  return enrollments;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ENROLLED SUBJECTS FOR A STUDENT
// ─────────────────────────────────────────────────────────────────────────────
export const getEnrolledSubjectsForStudentService = async (studentId, academicSessionId) => {
  const filter = { studentId, status: "active" };
  if (academicSessionId) filter.academicSessionId = academicSessionId;

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "subjectId",
      select: "name code semester credits subjectType assignedFaculty",
      populate: {
        path: "assignedFaculty",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      },
    })
    .populate("academicSessionId", "label");

  return enrollments;
};

