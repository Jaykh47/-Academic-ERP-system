import mongoose from "mongoose";
import {
  Examination,
  Marks,
  Subject,
  Faculty,
  Student,
  Enrollment,
  Notification,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { calculateGrade, calculateSGPA } from "../utils/gradeCalculator.js";

/**
 * MARKS & EXAMINATION SERVICE
 *
 * Implements business operations for:
 * 1. Creating and scheduling examinations.
 * 2. Uploading and updating student examination scores.
 * 3. Dynamic grade computation and statistics calculation.
 * 4. Comprehensive student semester report card with SGPA computation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CREATE EXAMINATION
// ─────────────────────────────────────────────────────────────────────────────
export const createExaminationService = async (data, requestingUser) => {
  const {
    name,
    examType,
    subjectId,
    academicSessionId,
    semester,
    maximumMarks,
    passMarks,
    weightage,
    examDate,
    description,
  } = data;

  const subject = await Subject.findById(subjectId).populate("departmentId");
  if (!subject) throw new ApiError(404, "Subject not found.");

  let creatorFacultyId;

  // Authorization check
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty) throw new ApiError(404, "Faculty profile not found.");

    if (!subject.assignedFaculty || subject.assignedFaculty.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only create examinations for subjects assigned to you.");
    }
    creatorFacultyId = faculty._id;
  } else if (requestingUser.role === "hod") {
    const hod = await Faculty.findOne({ userId: requestingUser._id });
    if (!hod || hod.departmentId.toString() !== subject.departmentId._id.toString()) {
      throw new ApiError(403, "HOD can only create examinations for subjects in their department.");
    }
    creatorFacultyId = subject.assignedFaculty || hod._id;
  } else {
    // Admin fallback
    creatorFacultyId = subject.assignedFaculty;
    if (!creatorFacultyId) {
      const adminFaculty = await Faculty.findOne();
      creatorFacultyId = adminFaculty ? adminFaculty._id : new mongoose.Types.ObjectId();
    }
  }

  const exam = await Examination.create({
    name,
    examType,
    subjectId,
    academicSessionId,
    semester: semester || subject.semester,
    maximumMarks,
    passMarks,
    weightage: weightage || 0,
    examDate,
    createdBy: creatorFacultyId,
    description,
  });

  // Notify enrolled students about the new examination
  try {
    const enrolledStudents = await Enrollment.find({
      subjectId: exam.subjectId,
      academicSessionId: exam.academicSessionId,
      status: "active",
    }).populate("studentId", "userId");

    const notifications = enrolledStudents
      .filter((e) => e.studentId && e.studentId.userId)
      .map((e) => ({
        recipientId: e.studentId.userId,
        title: `New Exam Scheduled: ${exam.name}`,
        message: `An examination '${exam.name}' for course '${subject.name}' (${subject.code}) has been scheduled.`,
        type: "exam_scheduled",
        relatedEntity: { kind: "Examination", item: exam._id },
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }
  } catch (err) {
    console.error("Failed to dispatch exam notifications:", err.message);
  }

  return await Examination.findById(exam._id)
    .populate("subjectId", "name code semester credits")
    .populate("academicSessionId", "label")
    .populate({
      path: "createdBy",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// LOCKING & AUDIT RULES
// ─────────────────────────────────────────────────────────────────────────────
export const GRACE_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours (2 days)

export const verifyExamLockStatus = (exam, requestingUser) => {
  if (!exam.isLocked) {
    return { isLocked: false, canEdit: true };
  }

  // Administrator role override
  if (requestingUser?.role === "admin") {
    return { isLocked: true, canEdit: true, isAdminOverride: true };
  }

  const lockedTime = exam.lockedAt ? new Date(exam.lockedAt).getTime() : Date.now();
  const elapsedMs = Date.now() - lockedTime;
  const remainingMs = GRACE_PERIOD_MS - elapsedMs;

  if (remainingMs <= 0) {
    const expiredDateStr = new Date(lockedTime + GRACE_PERIOD_MS).toLocaleString();
    throw new ApiError(
      403,
      `Marks for this examination are permanently locked. The 2-day edit window expired on ${expiredDateStr}. Contact administration for any official amendments.`
    );
  }

  const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
  return {
    isLocked: true,
    canEdit: true,
    remainingHours,
    lockExpiresAt: new Date(lockedTime + GRACE_PERIOD_MS),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST EXAMINATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getExaminationsService = async (filter) => {
  const exams = await Examination.find(filter)
    .populate("subjectId", "name code semester credits")
    .populate("academicSessionId", "label")
    .populate({
      path: "createdBy",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ examDate: -1, createdAt: -1 });

  return exams.map((exam) => {
    const isLocked = Boolean(exam.isLocked);
    const lockedTime = exam.lockedAt ? new Date(exam.lockedAt).getTime() : null;
    const lockExpiresAt = lockedTime ? new Date(lockedTime + GRACE_PERIOD_MS) : null;
    const elapsedMs = lockedTime ? Date.now() - lockedTime : 0;
    const isPermanentlyLocked = isLocked && elapsedMs > GRACE_PERIOD_MS;
    const remainingHours = isLocked && !isPermanentlyLocked ? Math.ceil((GRACE_PERIOD_MS - elapsedMs) / (1000 * 60 * 60)) : 0;
    const canEdit = !isLocked || !isPermanentlyLocked;

    const obj = exam.toObject();
    return {
      ...obj,
      isLocked,
      lockedAt: exam.lockedAt,
      lockExpiresAt,
      isPermanentlyLocked,
      remainingHours,
      canEdit,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCK EXAMINATION MARKS (Starts 2-Day Edit Window)
// ─────────────────────────────────────────────────────────────────────────────
export const lockExaminationService = async (examinationId, requestingUser) => {
  const exam = await Examination.findById(examinationId).populate("subjectId");
  if (!exam) throw new ApiError(404, "Examination not found.");

  let facultyId;
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty || exam.subjectId.assignedFaculty?.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only lock marks for your assigned courses.");
    }
    facultyId = faculty._id;
  } else if (requestingUser.role === "hod") {
    const hod = await Faculty.findOne({ userId: requestingUser._id });
    if (!hod || hod.departmentId?.toString() !== exam.subjectId.departmentId?.toString()) {
      throw new ApiError(403, "HOD can only lock marks for courses in their department.");
    }
    facultyId = hod._id;
  } else {
    const defaultFaculty = await Faculty.findOne();
    facultyId = defaultFaculty ? defaultFaculty._id : null;
  }

  // Ensure at least one mark has been entered before locking
  const marksCount = await Marks.countDocuments({ examinationId: exam._id });
  if (marksCount === 0) {
    throw new ApiError(400, "Cannot lock examination: No student marks have been uploaded yet. Please enter marks before locking.");
  }

  if (!exam.isLocked) {
    exam.isLocked = true;
    exam.lockedAt = new Date();
    exam.lockedBy = facultyId;
    await exam.save();
  }

  const expiresAt = new Date(new Date(exam.lockedAt).getTime() + GRACE_PERIOD_MS);
  const remainingMs = expiresAt.getTime() - Date.now();
  const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

  return {
    examinationId: exam._id,
    name: exam.name,
    isLocked: exam.isLocked,
    lockedAt: exam.lockedAt,
    lockExpiresAt: expiresAt,
    remainingHours,
    canEdit: remainingMs > 0,
    message: "Marks for this examination are now locked. They can still be edited within the 2-day (48-hour) grace window.",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT BATCH MARKS
// ─────────────────────────────────────────────────────────────────────────────
export const submitMarksService = async (data, requestingUser) => {
  const { examinationId, marks } = data;

  const exam = await Examination.findById(examinationId).populate("subjectId");
  if (!exam) throw new ApiError(404, "Examination not found.");

  // Check 2-day lock and edit window
  const lockStatus = verifyExamLockStatus(exam, requestingUser);

  let facultyId;

  // Authorization check
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty || exam.subjectId.assignedFaculty?.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only submit marks for your assigned courses.");
    }
    facultyId = faculty._id;
  } else {
    const defaultFaculty = await Faculty.findOne();
    facultyId = defaultFaculty ? defaultFaculty._id : new mongoose.Types.ObjectId();
  }

  // Verify all students are enrolled in this subject and session
  const studentIds = marks.map((m) => m.studentId);
  const enrollments = await Enrollment.find({
    subjectId: exam.subjectId._id,
    academicSessionId: exam.academicSessionId,
    studentId: { $in: studentIds },
    status: "active",
  }).select("studentId");

  const enrolledIdSet = new Set(enrollments.map((e) => e.studentId.toString()));
  const unauthorized = studentIds.filter((id) => !enrolledIdSet.has(id.toString()));
  if (unauthorized.length > 0) {
    throw new ApiError(
      400,
      `Cannot submit marks: ${unauthorized.length} student(s) are not enrolled in this course.`
    );
  }

  // Validate obtained marks <= maximumMarks
  for (const item of marks) {
    if (item.isAbsent) {
      item.obtainedMarks = 0;
    } else if (item.obtainedMarks > exam.maximumMarks) {
      throw new ApiError(
        400,
        `Obtained marks (${item.obtainedMarks}) cannot exceed maximum marks (${exam.maximumMarks}).`
      );
    }
  }

  // Bulk write with upsert to create or update marks idempotently
  const bulkOps = marks.map((item) => ({
    updateOne: {
      filter: {
        studentId: item.studentId,
        examinationId: exam._id,
      },
      update: {
        $set: {
          studentId: item.studentId,
          examinationId: exam._id,
          subjectId: exam.subjectId._id,
          academicSessionId: exam.academicSessionId,
          obtainedMarks: item.obtainedMarks,
          isAbsent: item.isAbsent || false,
          remarks: item.remarks || "",
          lastModifiedBy: facultyId,
        },
        $setOnInsert: {
          enteredBy: facultyId,
        },
      },
      upsert: true,
    },
  }));

  const bulkResult = await Marks.bulkWrite(bulkOps);

  // Notify students whose marks were uploaded
  try {
    const studentsWithUsers = await Student.find({
      _id: { $in: studentIds },
    }).select("userId");

    const notifications = studentsWithUsers
      .filter((s) => s.userId)
      .map((s) => ({
        recipientId: s.userId,
        title: `Marks Uploaded: ${exam.name}`,
        message: `Your marks for '${exam.name}' in '${exam.subjectId.name}' have been uploaded. View your result sheet to check your score and grade.`,
        type: "marks_uploaded",
        relatedEntity: { kind: "Examination", item: exam._id },
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }
  } catch (err) {
    console.error("Failed to dispatch marks notifications:", err.message);
  }

  return {
    examinationId: exam._id,
    maximumMarks: exam.maximumMarks,
    passMarks: exam.passMarks,
    totalRecordsProcessed: marks.length,
    newlyCreated: bulkResult.upsertedCount,
    updated: bulkResult.modifiedCount,
    isLocked: Boolean(exam.isLocked),
    remainingHours: lockStatus.remainingHours ?? null,
    warning: lockStatus.remainingHours ? `Notice: Marks are locked. You have ${lockStatus.remainingHours} hour(s) remaining in the 2-day edit window.` : undefined,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SINGLE STUDENT MARKS
// ─────────────────────────────────────────────────────────────────────────────
export const updateSingleMarksService = async (marksId, updates, requestingUser) => {
  const mark = await Marks.findById(marksId).populate("examinationId");
  if (!mark) throw new ApiError(404, "Marks record not found.");

  // Check 2-day lock and edit window
  verifyExamLockStatus(mark.examinationId, requestingUser);

  let facultyId;
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty) throw new ApiError(404, "Faculty profile not found.");
    facultyId = faculty._id;
  }

  if (updates.isAbsent !== undefined) {
    mark.isAbsent = updates.isAbsent;
    if (mark.isAbsent) mark.obtainedMarks = 0;
  }

  if (updates.obtainedMarks !== undefined && !mark.isAbsent) {
    if (updates.obtainedMarks > mark.examinationId.maximumMarks) {
      throw new ApiError(
        400,
        `Obtained marks (${updates.obtainedMarks}) cannot exceed maximum marks (${mark.examinationId.maximumMarks}).`
      );
    }
    mark.obtainedMarks = updates.obtainedMarks;
  }

  if (updates.remarks !== undefined) mark.remarks = updates.remarks;
  if (facultyId) mark.lastModifiedBy = facultyId;

  await mark.save();

  return await Marks.findById(mark._id)
    .populate({
      path: "studentId",
      select: "rollNumber enrollmentNumber userId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("examinationId", "name maximumMarks passMarks examType");
};

// ─────────────────────────────────────────────────────────────────────────────
// GET EXAMINATION RESULTS SHEET & CLASS PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
export const getExaminationResultsService = async (examinationId) => {
  const exam = await Examination.findById(examinationId)
    .populate("subjectId", "name code semester credits")
    .populate("academicSessionId", "label");

  if (!exam) throw new ApiError(404, "Examination not found.");

  const isLocked = Boolean(exam.isLocked);
  const lockedTime = exam.lockedAt ? new Date(exam.lockedAt).getTime() : null;
  const lockExpiresAt = lockedTime ? new Date(lockedTime + GRACE_PERIOD_MS) : null;
  const elapsedMs = lockedTime ? Date.now() - lockedTime : 0;
  const isPermanentlyLocked = isLocked && elapsedMs > GRACE_PERIOD_MS;
  const remainingHours = isLocked && !isPermanentlyLocked ? Math.ceil((GRACE_PERIOD_MS - elapsedMs) / (1000 * 60 * 60)) : 0;
  const canEdit = !isLocked || !isPermanentlyLocked;

  const marksRecords = await Marks.find({ examinationId: exam._id })
    .populate({
      path: "studentId",
      select: "rollNumber enrollmentNumber currentSemester userId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ obtainedMarks: -1 });

  let totalAppeared = 0;
  let totalAbsent = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let sumMarks = 0;
  let highestMark = 0;
  let lowestMark = exam.maximumMarks;

  const results = marksRecords.map((m) => {
    const isAbsent = m.isAbsent;
    const score = m.obtainedMarks;

    if (isAbsent) {
      totalAbsent += 1;
    } else {
      totalAppeared += 1;
      sumMarks += score;
      if (score > highestMark) highestMark = score;
      if (score < lowestMark) lowestMark = score;
    }

    const evaluation = calculateGrade(score, exam.maximumMarks);
    const passed = !isAbsent && score >= exam.passMarks;

    if (passed) totalPassed += 1;
    else if (!isAbsent) totalFailed += 1;

    return {
      marksId: m._id,
      studentId: m.studentId._id,
      rollNumber: m.studentId.rollNumber,
      name: m.studentId.userId.name,
      email: m.studentId.userId.email,
      obtainedMarks: score,
      maximumMarks: exam.maximumMarks,
      isAbsent,
      percentage: evaluation.percentage,
      grade: evaluation.grade,
      gradePoint: evaluation.gradePoint,
      isPassed: passed,
      remarks: m.remarks,
    };
  });

  const averageMark = totalAppeared > 0 ? Number((sumMarks / totalAppeared).toFixed(2)) : 0;
  if (totalAppeared === 0) lowestMark = 0;

  return {
    examination: {
      _id: exam._id,
      name: exam.name,
      examType: exam.examType,
      subject: exam.subjectId,
      academicSession: exam.academicSessionId,
      maximumMarks: exam.maximumMarks,
      passMarks: exam.passMarks,
      weightage: exam.weightage,
      examDate: exam.examDate,
      isLocked,
      lockedAt: exam.lockedAt,
      lockExpiresAt,
      isPermanentlyLocked,
      remainingHours,
      canEdit,
    },
    statistics: {
      totalStudents: results.length,
      appearedCount: totalAppeared,
      absentCount: totalAbsent,
      passedCount: totalPassed,
      failedCount: totalFailed,
      passPercentage: totalAppeared > 0 ? Number(((totalPassed / totalAppeared) * 100).toFixed(2)) : 0,
      highestMark,
      lowestMark,
      averageMark,
    },
    results,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SEMESTER REPORT CARD (With SGPA)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentSemesterReportService = async (studentId, semester, academicSessionId) => {
  const student = await Student.findById(studentId)
    .populate("userId", "name email")
    .populate("departmentId", "name code");

  if (!student) throw new ApiError(404, "Student not found.");

  // Find all subjects enrolled for this student in this semester/session
  const filter = {
    studentId: student._id,
    semester,
    status: "active",
  };
  if (academicSessionId) {
    filter.academicSessionId = academicSessionId;
  }

  let enrollments = await Enrollment.find(filter).populate("subjectId");

  // Fallback: if no enrollments matched with academicSessionId, check without academicSessionId
  if (!enrollments.length && academicSessionId) {
    enrollments = await Enrollment.find({
      studentId: student._id,
      semester,
      status: "active",
    }).populate("subjectId");
  }

  // Filter out any enrollments whose subjectId is missing/deleted
  enrollments = enrollments.filter((e) => e.subjectId);

  if (!enrollments.length) {
    throw new ApiError(404, `No active course enrollments found for student in Semester ${semester}.`);
  }

  const subjectReports = await Promise.all(
    enrollments.map(async (enrollment) => {
      const subject = enrollment.subjectId;

      // Fetch all marks for this student in this subject
      const marksFilter = {
        studentId: student._id,
        subjectId: subject._id,
      };
      if (academicSessionId) {
        marksFilter.academicSessionId = academicSessionId;
      }

      let studentMarks = await Marks.find(marksFilter).populate("examinationId");
      if (!studentMarks.length && academicSessionId) {
        studentMarks = await Marks.find({
          studentId: student._id,
          subjectId: subject._id,
        }).populate("examinationId");
      }

      const validMarks = studentMarks.filter((m) => m.examinationId);

      // If no valid examinations or marks recorded yet, keep as PENDING
      // NEVER default to 0 / Fail!
      if (validMarks.length === 0) {
        return {
          subjectId: subject._id,
          name: subject.name,
          code: subject.code,
          credits: subject.credits,
          subjectType: subject.subjectType,
          isEvaluated: false,
          totalObtainedMarks: null,
          totalMaxMarks: null,
          percentage: null,
          grade: "PENDING",
          gradePoint: null,
          isPassed: null,
          examinations: [],
        };
      }

      let totalMaxMarks = 0;
      let totalObtainedMarks = 0;

      const examBreakdown = validMarks.map((m) => {
        const exam = m.examinationId;
        const maxMarks = exam.maximumMarks || 100;
        const evaluation = calculateGrade(m.obtainedMarks, maxMarks);

        totalMaxMarks += maxMarks;
        totalObtainedMarks += m.obtainedMarks;

        return {
          examinationName: exam.name || "Assessment",
          examType: exam.examType || "regular",
          maximumMarks: maxMarks,
          passMarks: exam.passMarks || 40,
          obtainedMarks: m.obtainedMarks,
          isAbsent: m.isAbsent || false,
          percentage: evaluation.percentage,
          grade: evaluation.grade,
          gradePoint: evaluation.gradePoint,
          isPassed: !m.isAbsent && m.obtainedMarks >= (exam.passMarks || 40),
        };
      });

      const overallSubjectEval = calculateGrade(totalObtainedMarks, totalMaxMarks || 100);

      return {
        subjectId: subject._id,
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        subjectType: subject.subjectType,
        isEvaluated: true,
        totalObtainedMarks,
        totalMaxMarks,
        percentage: overallSubjectEval.percentage,
        grade: overallSubjectEval.grade,
        gradePoint: overallSubjectEval.gradePoint,
        isPassed: overallSubjectEval.isPassed,
        examinations: examBreakdown,
      };
    })
  );

  const totalSubjects = subjectReports.length;
  const evaluatedSubjects = subjectReports.filter((s) => s.isEvaluated);
  const pendingSubjects = subjectReports.filter((s) => !s.isEvaluated);
  const isComplete = totalSubjects > 0 && pendingSubjects.length === 0;

  let sgpa = null;
  let resultStatus = "PENDING";
  const totalCredits = subjectReports.reduce((sum, s) => sum + (s.credits || 0), 0);

  // SGPA is strictly calculated ONLY when all enrolled subjects have been evaluated
  if (isComplete) {
    sgpa = calculateSGPA(subjectReports);
    const allPassed = subjectReports.every((s) => s.isPassed);
    resultStatus = allPassed ? "PASSED" : "FAILED";
  }

  return {
    student: {
      _id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      rollNumber: student.rollNumber,
      enrollmentNumber: student.enrollmentNumber,
      department: student.departmentId?.name || "Academic Department",
      semester,
    },
    academicSummary: {
      totalSubjects,
      totalCredits,
      evaluatedSubjectsCount: evaluatedSubjects.length,
      pendingSubjectsCount: pendingSubjects.length,
      isComplete,
      sgpa,
      resultStatus,
    },
    subjects: subjectReports,
  };
};

