import mongoose from "mongoose";
import {
  ClassSession,
  Attendance,
  Subject,
  Faculty,
  Student,
  Enrollment,
  Notification,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/**
 * ATTENDANCE SERVICE
 *
 * Implements the core attendance business logic:
 * 1. Scheduling and conducting class sessions.
 * 2. Marking and locking attendance submissions.
 * 3. Attendance record corrections with audit trail.
 * 4. High-performance MongoDB aggregation pipelines for attendance calculations.
 * 5. Dynamic shortage detection and recovery forecasting.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CLASS SESSION
// ─────────────────────────────────────────────────────────────────────────────
export const createClassSessionService = async (data, requestingUser) => {
  const {
    subjectId,
    academicSessionId,
    date,
    startTime,
    endTime,
    sessionType,
    topic,
    room,
  } = data;

  const subject = await Subject.findById(subjectId).populate("departmentId");
  if (!subject) throw new ApiError(404, "Subject not found.");

  let facultyId;

  // Resource check:
  // If user is Faculty, ensure they are the assigned faculty for this subject
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty) throw new ApiError(404, "Faculty profile not found.");

    if (!subject.assignedFaculty || subject.assignedFaculty.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only schedule classes for subjects assigned to you.");
    }
    facultyId = faculty._id;
  } else if (requestingUser.role === "hod") {
    // HOD can create class sessions for their department's subjects
    const hod = await Faculty.findOne({ userId: requestingUser._id });
    if (!hod || hod.departmentId.toString() !== subject.departmentId._id.toString()) {
      throw new ApiError(403, "HOD can only schedule classes within their department.");
    }
    facultyId = subject.assignedFaculty || hod._id;
  } else {
    // Admin can specify or fallback to subject's assigned faculty
    facultyId = subject.assignedFaculty;
    if (!facultyId) {
      throw new ApiError(400, "Cannot schedule a class for a subject without an assigned faculty member.");
    }
  }

  const session = await ClassSession.create({
    subjectId,
    facultyId,
    academicSessionId,
    date,
    startTime,
    endTime,
    sessionType: sessionType || "lecture",
    topic,
    room,
    status: "scheduled",
    isAttendanceSubmitted: false,
  });

  return await ClassSession.findById(session._id)
    .populate("subjectId", "name code semester")
    .populate({
      path: "facultyId",
      select: "employeeId designation userId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("academicSessionId", "label");
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT ATTENDANCE FOR A CLASS SESSION
// ─────────────────────────────────────────────────────────────────────────────
export const submitAttendanceService = async (data, requestingUser) => {
  const { classSessionId, records } = data;

  const session = await ClassSession.findById(classSessionId);
  if (!session) throw new ApiError(404, "Class session not found.");

  // Ensure attendance has not already been submitted
  if (session.isAttendanceSubmitted) {
    throw new ApiError(
      400,
      "Attendance for this class session has already been submitted and locked. Use the correction endpoint for changes."
    );
  }

  // Authorization: Only assigned faculty, department HOD, or Admin can submit
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty || session.facultyId.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only submit attendance for your own class sessions.");
    }
  }

  // Verify all students are enrolled in this subject and session
  const studentIds = records.map((r) => r.studentId);
  const enrolledStudents = await Enrollment.find({
    subjectId: session.subjectId,
    academicSessionId: session.academicSessionId,
    studentId: { $in: studentIds },
    status: "active",
  }).select("studentId");

  const enrolledIdSet = new Set(enrolledStudents.map((e) => e.studentId.toString()));

  const unauthorizedStudents = studentIds.filter((id) => !enrolledIdSet.has(id.toString()));
  if (unauthorizedStudents.length > 0) {
    throw new ApiError(
      400,
      `Cannot mark attendance: ${unauthorizedStudents.length} student(s) are not enrolled in this course.`
    );
  }

  // Build attendance documents
  const attendanceDocs = records.map((record) => ({
    studentId: record.studentId,
    classSessionId: session._id,
    subjectId: session.subjectId,
    facultyId: session.facultyId,
    academicSessionId: session.academicSessionId,
    date: session.date,
    status: record.status,
    remarks: record.remarks || "",
  }));

  // Insert attendance records
  await Attendance.insertMany(attendanceDocs, { ordered: true });

  // Lock the class session
  session.isAttendanceSubmitted = true;
  session.status = "completed";
  await session.save();

  // Check and dispatch attendance shortage notifications
  try {
    const totalConducted = await ClassSession.countDocuments({
      subjectId: session.subjectId,
      isAttendanceSubmitted: true,
      academicSessionId: session.academicSessionId,
    });

    for (const record of records) {
      if (record.status === "absent") {
        const attended = await Attendance.countDocuments({
          studentId: record.studentId,
          subjectId: session.subjectId,
          academicSessionId: session.academicSessionId,
          status: { $in: ["present", "late"] },
        });

        const pct = totalConducted > 0 ? (attended / totalConducted) * 100 : 100;
        if (pct < 75) {
          const student = await Student.findById(record.studentId).populate("userId");
          if (student && student.userId) {
            await Notification.create({
              recipientId: student.userId._id,
              title: "Attendance Shortage Alert",
              message: `Warning: Your attendance in course has dropped to ${pct.toFixed(1)}%, which is below the mandatory 75% institutional threshold.`,
              type: "attendance_shortage",
              relatedEntity: { kind: "Subject", item: session.subjectId },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to dispatch attendance shortage notification:", err.message);
  }

  return {
    classSessionId: session._id,
    totalSubmitted: attendanceDocs.length,
    presentCount: records.filter((r) => r.status === "present").length,
    absentCount: records.filter((r) => r.status === "absent").length,
    lateCount: records.filter((r) => r.status === "late").length,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CORRECT ATTENDANCE (Audit Controlled)
// ─────────────────────────────────────────────────────────────────────────────
export const correctAttendanceService = async (attendanceId, { status, remarks }, requestingUser) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) throw new ApiError(404, "Attendance record not found.");

  // Faculty can only correct their own records
  if (requestingUser.role === "faculty") {
    const faculty = await Faculty.findOne({ userId: requestingUser._id });
    if (!faculty || attendance.facultyId.toString() !== faculty._id.toString()) {
      throw new ApiError(403, "You can only correct attendance records for your own classes.");
    }
  }

  attendance.status = status;
  if (remarks) attendance.remarks = remarks;
  attendance.isCorrected = true;
  attendance.correctedBy = requestingUser._id;
  attendance.correctedAt = new Date();

  await attendance.save();

  return await Attendance.findById(attendance._id)
    .populate({
      path: "studentId",
      select: "rollNumber enrollmentNumber userId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("correctedBy", "name email role");
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT ATTENDANCE SUMMARY (MongoDB Aggregation Pipeline)
// Computes live statistics for all enrolled students in a subject
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectAttendanceSummaryService = async (subjectId, academicSessionId, lateWeight = 1.0) => {
  const subjectObjId = new mongoose.Types.ObjectId(subjectId);
  const sessionFilter = academicSessionId ? { academicSessionId: new mongoose.Types.ObjectId(academicSessionId) } : {};

  // 1. Get total conducted sessions (denominator)
  const totalConducted = await ClassSession.countDocuments({
    subjectId: subjectObjId,
    isAttendanceSubmitted: true,
    ...sessionFilter,
  });

  // 2. Aggregate student attendance counts
  const pipeline = [
    {
      $match: {
        subjectId: subjectObjId,
        ...sessionFilter,
      },
    },
    {
      $group: {
        _id: "$studentId",
        totalPresent: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        totalLate: {
          $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
        },
        totalAbsent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        totalRecorded: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $lookup: {
        from: "users",
        localField: "student.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        studentId: "$_id",
        rollNumber: "$student.rollNumber",
        name: "$user.name",
        email: "$user.email",
        totalPresent: 1,
        totalLate: 1,
        totalAbsent: 1,
        totalRecorded: 1,
      },
    },
    { $sort: { rollNumber: 1 } },
  ];

  const studentAggregates = await Attendance.aggregate(pipeline);

  // Compute percentage and shortage status
  const studentsSummary = studentAggregates.map((item) => {
    const weightedPresent = item.totalPresent + item.totalLate * lateWeight;
    const percentage = totalConducted > 0 ? Number(((weightedPresent / totalConducted) * 100).toFixed(2)) : 100.0;
    const isShortage = percentage < 75.0;

    // Consecutive classes needed to reach 75%:
    // (P + x) / (C + x) >= 0.75  =>  x >= (0.75 * C - P) / (1 - 0.75)
    let classesNeededFor75 = 0;
    if (isShortage && totalConducted > 0) {
      const needed = (0.75 * totalConducted - weightedPresent) / 0.25;
      classesNeededFor75 = Math.max(0, Math.ceil(needed));
    }

    return {
      ...item,
      totalConductedClasses: totalConducted,
      attendancePercentage: percentage,
      isShortage,
      classesNeededFor75,
    };
  });

  return {
    subjectId,
    totalConductedClasses: totalConducted,
    totalEnrolledStudents: studentsSummary.length,
    shortageCount: studentsSummary.filter((s) => s.isShortage).length,
    students: studentsSummary,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT'S FULL ATTENDANCE BREAKDOWN (Across All Subjects)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentFullAttendanceService = async (studentId, academicSessionId, lateWeight = 1.0) => {
  const student = await Student.findById(studentId).populate("userId", "name email");
  if (!student) throw new ApiError(404, "Student not found.");

  const studentObjId = new mongoose.Types.ObjectId(studentId);
  const sessionFilter = academicSessionId ? { academicSessionId: new mongoose.Types.ObjectId(academicSessionId) } : {};

  // Aggregate attendance per subject for this student
  const pipeline = [
    {
      $match: {
        studentId: studentObjId,
        ...sessionFilter,
      },
    },
    {
      $group: {
        _id: "$subjectId",
        totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        totalLate: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        totalRecorded: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject",
      },
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        name: "$subject.name",
        code: "$subject.code",
        credits: "$subject.credits",
        semester: "$subject.semester",
        totalPresent: 1,
        totalLate: 1,
        totalAbsent: 1,
        totalRecorded: 1,
      },
    },
    { $sort: { code: 1 } },
  ];

  const subjectRecords = await Attendance.aggregate(pipeline);

  // For each subject, fetch total conducted classes
  let totalConductedAllSubjects = 0;
  let totalAttendedAllSubjects = 0;

  const subjectBreakdown = await Promise.all(
    subjectRecords.map(async (record) => {
      const conducted = await ClassSession.countDocuments({
        subjectId: record.subjectId,
        isAttendanceSubmitted: true,
        ...sessionFilter,
      });

      const weightedPresent = record.totalPresent + record.totalLate * lateWeight;
      const percentage = conducted > 0 ? Number(((weightedPresent / conducted) * 100).toFixed(2)) : 100.0;
      const isShortage = percentage < 75.0;

      let classesNeededFor75 = 0;
      if (isShortage && conducted > 0) {
        const needed = (0.75 * conducted - weightedPresent) / 0.25;
        classesNeededFor75 = Math.max(0, Math.ceil(needed));
      }

      totalConductedAllSubjects += conducted;
      totalAttendedAllSubjects += weightedPresent;

      return {
        ...record,
        totalConductedClasses: conducted,
        attendancePercentage: percentage,
        isShortage,
        classesNeededFor75,
      };
    })
  );

  const overallPercentage =
    totalConductedAllSubjects > 0
      ? Number(((totalAttendedAllSubjects / totalConductedAllSubjects) * 100).toFixed(2))
      : 100.0;

  return {
    student: {
      _id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      rollNumber: student.rollNumber,
      enrollmentNumber: student.enrollmentNumber,
      currentSemester: student.currentSemester,
    },
    overallStats: {
      totalConductedClasses: totalConductedAllSubjects,
      totalAttendedClasses: totalAttendedAllSubjects,
      overallPercentage,
      isOverallShortage: overallPercentage < 75.0,
    },
    subjectBreakdown,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE SHORTAGE REPORT (College / Department Level)
// Identifies all students with attendance below threshold (default 75%)
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceShortageReportService = async ({
  departmentId,
  semester,
  academicSessionId,
  threshold = 75.0,
}) => {
  // Find all subjects in department / semester
  const subjectFilter = { isActive: true };
  if (departmentId) subjectFilter.departmentId = departmentId;
  if (semester) subjectFilter.semester = parseInt(semester);

  const subjects = await Subject.find(subjectFilter).select("_id name code semester departmentId");

  const shortageList = [];

  for (const subject of subjects) {
    const summary = await getSubjectAttendanceSummaryService(subject._id, academicSessionId);
    const atRisk = summary.students.filter((s) => s.attendancePercentage < threshold);

    if (atRisk.length > 0) {
      shortageList.push({
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          semester: subject.semester,
        },
        threshold,
        totalConductedClasses: summary.totalConductedClasses,
        atRiskStudentsCount: atRisk.length,
        students: atRisk,
      });
    }
  }

  return {
    threshold,
    totalSubjectsWithShortage: shortageList.length,
    report: shortageList,
  };
};

