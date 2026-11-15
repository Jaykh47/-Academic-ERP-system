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

// ─────────────────────────────────────────────────────────────────────────────
// DIGICAMPUS COURSE REGISTRATION & TIMELINE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the course enrollment window is currently open
 */
export const getEnrollmentTimelineService = async () => {
  const session = await AcademicSession.findOne({ isCurrent: true, isActive: true });
  if (!session) {
    return {
      isOpen: false,
      session: null,
      message: "No active academic session found.",
    };
  }

  const now = new Date();
  let isOpen = Boolean(session.isEnrollmentOpen);

  if (session.enrollmentStartDate && session.enrollmentEndDate) {
    const start = new Date(session.enrollmentStartDate);
    const end = new Date(session.enrollmentEndDate);
    isOpen = isOpen && now >= start && now <= end;
  }

  return {
    isOpen,
    session,
    timeline: {
      startDate: session.enrollmentStartDate,
      endDate: session.enrollmentEndDate,
      isExplicitlyOpen: session.isEnrollmentOpen,
    },
  };
};

/**
 * Get all subjects offered for the student's department and semester,
 * indicating which ones the student is currently enrolled in.
 */
export const getAvailableSubjectsForStudentService = async (userId) => {
  const student = await Student.findOne({ userId }).populate("departmentId", "name code");
  if (!student) throw new ApiError(404, "Student profile not found.");

  const session = await AcademicSession.findOne({ isCurrent: true, isActive: true });
  if (!session) throw new ApiError(404, "Active academic session not found.");

  // Get subjects offered for student's department & semester
  const offeredSubjects = await Subject.find({
    departmentId: student.departmentId._id,
    semester: student.currentSemester,
    isActive: true,
  })
    .populate("departmentId", "name code")
    .populate({
      path: "assignedFaculty",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ code: 1 });

  // Get active enrollments for this student in this session
  const activeEnrollments = await Enrollment.find({
    studentId: student._id,
    academicSessionId: session._id,
    status: "active",
  });

  const enrolledSubjectIds = new Set(activeEnrollments.map((e) => e.subjectId.toString()));

  const subjectsWithStatus = offeredSubjects.map((sub) => {
    const subObj = sub.toObject();
    return {
      ...subObj,
      isEnrolled: enrolledSubjectIds.has(sub._id.toString()),
    };
  });

  const timelineStatus = await getEnrollmentTimelineService();

  return {
    student: {
      _id: student._id,
      rollNumber: student.rollNumber,
      enrollmentNumber: student.enrollmentNumber,
      currentSemester: student.currentSemester,
      department: student.departmentId,
    },
    session,
    enrollmentWindow: timelineStatus,
    subjects: subjectsWithStatus,
    totalOffered: offeredSubjects.length,
    enrolledCount: enrolledSubjectIds.size,
  };
};

/**
 * Student self-enrolls in one or more subjects during the open timeline window
 */
export const selfEnrollStudentService = async (userId, subjectIds) => {
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new ApiError(400, "Please select at least one subject to enroll.");
  }

  // 1. Verify Enrollment Window
  const timeline = await getEnrollmentTimelineService();
  if (!timeline.isOpen) {
    const datesMsg =
      timeline.session?.enrollmentStartDate && timeline.session?.enrollmentEndDate
        ? ` Registration window: ${new Date(timeline.session.enrollmentStartDate).toLocaleDateString()} to ${new Date(timeline.session.enrollmentEndDate).toLocaleDateString()}.`
        : "";
    throw new ApiError(
      403,
      `Subject enrollment is currently closed by administration.${datesMsg}`
    );
  }

  // 2. Verify Student
  const student = await Student.findOne({ userId });
  if (!student) throw new ApiError(404, "Student profile not found.");

  const session = timeline.session;

  // 3. Verify Subjects belong to student's department and semester
  const validSubjects = await Subject.find({
    _id: { $in: subjectIds },
    departmentId: student.departmentId,
    semester: student.currentSemester,
    isActive: true,
  });

  if (validSubjects.length === 0) {
    throw new ApiError(400, "None of the selected subjects are valid for your department and semester.");
  }

  // 4. Enroll using bulkWrite upsert
  const bulkOps = validSubjects.map((sub) => ({
    updateOne: {
      filter: {
        studentId: student._id,
        subjectId: sub._id,
        academicSessionId: session._id,
      },
      update: {
        $set: {
          studentId: student._id,
          subjectId: sub._id,
          academicSessionId: session._id,
          semester: student.currentSemester,
          status: "active",
          enrolledAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await Enrollment.bulkWrite(bulkOps);

  const updatedEnrollments = await getEnrolledSubjectsForStudentService(student._id, session._id);

  return {
    enrolledCount: validSubjects.length,
    enrolledSubjects: updatedEnrollments,
  };
};

/**
 * Student drops a subject during the open enrollment window
 */
export const selfDropSubjectService = async (userId, subjectId) => {
  const timeline = await getEnrollmentTimelineService();
  if (!timeline.isOpen) {
    throw new ApiError(403, "Subject changes are locked. The enrollment window is closed.");
  }

  const student = await Student.findOne({ userId });
  if (!student) throw new ApiError(404, "Student profile not found.");

  const session = timeline.session;

  const result = await Enrollment.findOneAndUpdate(
    {
      studentId: student._id,
      subjectId,
      academicSessionId: session._id,
    },
    { status: "dropped" },
    { new: true }
  );

  if (!result) {
    throw new ApiError(404, "Enrollment record not found.");
  }

  return { message: "Subject dropped successfully." };
};

/**
 * Faculty Isolation: Returns strictly the subjects taught by the logged-in faculty
 */
export const getMyAssignedSubjectsService = async (user) => {
  if (user.role === "admin") {
    return await Subject.find({ isActive: true })
      .populate("departmentId", "name code")
      .populate({
        path: "assignedFaculty",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ semester: 1, name: 1 });
  }

  const faculty = await Faculty.findOne({ userId: user._id });
  if (!faculty) {
    return [];
  }

  const subjects = await Subject.find({
    $or: [{ assignedFaculty: faculty._id }, { _id: { $in: faculty.subjects || [] } }],
    isActive: true,
  })
    .populate("departmentId", "name code")
    .sort({ semester: 1, name: 1 });

  return subjects;
};


