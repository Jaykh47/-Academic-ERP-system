import mongoose from "mongoose";
import {
  Department,
  Subject,
  Faculty,
  Student,
  ClassSession,
  Attendance,
  Examination,
  Marks,
  Enrollment,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { calculateGrade } from "../utils/gradeCalculator.js";

/**
 * ANALYTICS SERVICE
 *
 * Implements high-level institutional intelligence:
 * 1. Departmental academic & attendance analytics.
 * 2. Subject-wise performance metrics and grade distribution histograms.
 * 3. Cohort performance comparison and attendance-performance correlation.
 * 4. Transparent, rule-based Academic Risk Detection Engine.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEPARTMENT-LEVEL ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartmentAnalyticsService = async (departmentId, academicSessionId) => {
  const department = await Department.findById(departmentId).populate({
    path: "hod",
    populate: { path: "userId", select: "name email" },
  });
  if (!department) throw new ApiError(404, "Department not found.");

  const deptObjId = new mongoose.Types.ObjectId(departmentId);
  const sessionFilter = academicSessionId ? { academicSessionId: new mongoose.Types.ObjectId(academicSessionId) } : {};

  // 1. Counts
  const [totalStudents, totalFaculty, totalSubjects] = await Promise.all([
    Student.countDocuments({ departmentId: deptObjId, status: "active" }),
    Faculty.countDocuments({ departmentId: deptObjId }),
    Subject.countDocuments({ departmentId: deptObjId, isActive: true }),
  ]);

  // 2. Fetch all subjects of this department
  const subjects = await Subject.find({ departmentId: deptObjId, isActive: true }).select("_id");
  const subjectIds = subjects.map((s) => s._id);

  // 3. Department Attendance Statistics
  const totalConductedClasses = await ClassSession.countDocuments({
    subjectId: { $in: subjectIds },
    isAttendanceSubmitted: true,
    ...sessionFilter,
  });

  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        subjectId: { $in: subjectIds },
        ...sessionFilter,
      },
    },
    {
      $group: {
        _id: null,
        totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        totalLate: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        totalRecords: { $sum: 1 },
      },
    },
  ]);

  let deptAverageAttendance = 100.0;
  let totalPresentCount = 0;
  let totalAbsentCount = 0;
  let totalLateCount = 0;

  if (attendanceStats.length > 0 && attendanceStats[0].totalRecords > 0) {
    totalPresentCount = attendanceStats[0].totalPresent;
    totalLateCount = attendanceStats[0].totalLate;
    totalAbsentCount = attendanceStats[0].totalAbsent;
    const weightedPresent = totalPresentCount + totalLateCount;
    deptAverageAttendance = Number(((weightedPresent / attendanceStats[0].totalRecords) * 100).toFixed(2));
  }

  // 4. Department Examination & Academic Performance
  const marksStats = await Marks.aggregate([
    {
      $match: {
        subjectId: { $in: subjectIds },
        ...sessionFilter,
      },
    },
    {
      $lookup: {
        from: "examinations",
        localField: "examinationId",
        foreignField: "_id",
        as: "exam",
      },
    },
    { $unwind: "$exam" },
    {
      $project: {
        obtainedMarks: 1,
        maximumMarks: "$exam.maximumMarks",
        passMarks: "$exam.passMarks",
        isAbsent: 1,
        percentage: {
          $cond: [
            { $eq: ["$isAbsent", true] },
            0,
            { $multiply: [{ $divide: ["$obtainedMarks", "$exam.maximumMarks"] }, 100] },
          ],
        },
        isPassed: {
          $cond: [
            { $and: [{ $eq: ["$isAbsent", false] }, { $gte: ["$obtainedMarks", "$exam.passMarks"] }] },
            1,
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAppeared: { $sum: 1 },
        totalPassed: { $sum: "$isPassed" },
        avgPercentage: { $avg: "$percentage" },
      },
    },
  ]);

  let deptPassRate = 0;
  let deptAverageScore = 0;
  if (marksStats.length > 0 && marksStats[0].totalAppeared > 0) {
    deptPassRate = Number(((marksStats[0].totalPassed / marksStats[0].totalAppeared) * 100).toFixed(2));
    deptAverageScore = Number((marksStats[0].avgPercentage || 0).toFixed(2));
  }

  return {
    department: {
      _id: department._id,
      name: department.name,
      code: department.code,
      hod: department.hod ? department.hod.userId.name : "Unassigned",
    },
    counts: {
      activeStudents: totalStudents,
      facultyMembers: totalFaculty,
      activeSubjects: totalSubjects,
      totalClassesConducted: totalConductedClasses,
    },
    attendance: {
      averageAttendancePercentage: deptAverageAttendance,
      presentRecords: totalPresentCount,
      lateRecords: totalLateCount,
      absentRecords: totalAbsentCount,
    },
    academics: {
      passRatePercentage: deptPassRate,
      averageExaminationScore: deptAverageScore,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUBJECT-LEVEL ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectAnalyticsService = async (subjectId, academicSessionId) => {
  const subject = await Subject.findById(subjectId)
    .populate("departmentId", "name code")
    .populate({
      path: "assignedFaculty",
      populate: { path: "userId", select: "name email" },
    });

  if (!subject) throw new ApiError(404, "Subject not found.");

  const subjectObjId = new mongoose.Types.ObjectId(subjectId);
  const sessionFilter = academicSessionId ? { academicSessionId: new mongoose.Types.ObjectId(academicSessionId) } : {};

  // 1. Conducted class sessions count
  const conductedClassesCount = await ClassSession.countDocuments({
    subjectId: subjectObjId,
    isAttendanceSubmitted: true,
    ...sessionFilter,
  });

  // 2. Student attendance distribution (<75%, 75-85%, >85%)
  const studentAttendanceData = await Attendance.aggregate([
    {
      $match: {
        subjectId: subjectObjId,
        ...sessionFilter,
      },
    },
    {
      $group: {
        _id: "$studentId",
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);

  let attendanceBelow75 = 0;
  let attendance75to85 = 0;
  let attendanceAbove85 = 0;

  studentAttendanceData.forEach((item) => {
    const effectivePresent = item.present + item.late;
    const pct = conductedClassesCount > 0 ? (effectivePresent / conductedClassesCount) * 100 : 100;
    if (pct < 75) attendanceBelow75++;
    else if (pct <= 85) attendance75to85++;
    else attendanceAbove85++;
  });

  // 3. Examination Performance & Grade Distribution Histogram
  const marks = await Marks.find({
    subjectId: subjectObjId,
    ...sessionFilter,
  }).populate("examinationId", "name examType maximumMarks passMarks");

  const gradeHistogram = {
    O: 0,
    "A+": 0,
    A: 0,
    "B+": 0,
    B: 0,
    C: 0,
    P: 0,
    F: 0,
  };

  let totalMarksScored = 0;
  let totalPossibleMarks = 0;
  let passCount = 0;
  let failCount = 0;

  marks.forEach((m) => {
    if (m.examinationId) {
      totalMarksScored += m.obtainedMarks;
      totalPossibleMarks += m.examinationId.maximumMarks;

      const evalResult = calculateGrade(m.obtainedMarks, m.examinationId.maximumMarks);
      if (gradeHistogram[evalResult.grade] !== undefined) {
        gradeHistogram[evalResult.grade]++;
      }

      if (!m.isAbsent && m.obtainedMarks >= m.examinationId.passMarks) {
        passCount++;
      } else {
        failCount++;
      }
    }
  });

  const overallAverageScore =
    totalPossibleMarks > 0 ? Number(((totalMarksScored / totalPossibleMarks) * 100).toFixed(2)) : 0;
  const overallPassRate =
    marks.length > 0 ? Number(((passCount / marks.length) * 100).toFixed(2)) : 0;

  return {
    subject: {
      _id: subject._id,
      name: subject.name,
      code: subject.code,
      semester: subject.semester,
      credits: subject.credits,
      department: subject.departmentId.name,
      instructor: subject.assignedFaculty ? subject.assignedFaculty.userId.name : "Unassigned",
    },
    attendanceOverview: {
      totalConductedClasses: conductedClassesCount,
      enrolledStudentsTracked: studentAttendanceData.length,
      distribution: {
        shortageBelow75: attendanceBelow75,
        average75To85: attendance75to85,
        goodAbove85: attendanceAbove85,
      },
    },
    academicPerformance: {
      totalAssessmentsLogged: marks.length,
      averageScorePercentage: overallAverageScore,
      passPercentage: overallPassRate,
      passedCount: passCount,
      failedCount: failCount,
      gradeHistogram,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. COHORT PERFORMANCE & ATTENDANCE-ACADEMIC CORRELATION
// ─────────────────────────────────────────────────────────────────────────────
export const getCohortAnalyticsService = async ({ departmentId, semester, academicSessionId }) => {
  const students = await Student.find({
    departmentId,
    currentSemester: semester,
    status: "active",
  }).populate("userId", "name email");

  if (!students.length) {
    throw new ApiError(404, `No active students found in Semester ${semester}.`);
  }

  const subjects = await Subject.find({
    departmentId,
    semester,
    isActive: true,
  });

  const subjectIds = subjects.map((s) => s._id);

  // Total classes conducted for this semester cohort
  const totalConducted = await ClassSession.countDocuments({
    subjectId: { $in: subjectIds },
    isAttendanceSubmitted: true,
    ...(academicSessionId ? { academicSessionId } : {}),
  });

  // Evaluate each student's attendance & average marks
  const cohortRecords = await Promise.all(
    students.map(async (student) => {
      // 1. Attendance
      const attendanceDocs = await Attendance.find({
        studentId: student._id,
        subjectId: { $in: subjectIds },
        ...(academicSessionId ? { academicSessionId } : {}),
      });

      const presentCount = attendanceDocs.filter((a) => a.status === "present" || a.status === "late").length;
      const attendancePct = totalConducted > 0 ? Number(((presentCount / totalConducted) * 100).toFixed(2)) : 100;

      // 2. Marks
      const marksDocs = await Marks.find({
        studentId: student._id,
        subjectId: { $in: subjectIds },
        ...(academicSessionId ? { academicSessionId } : {}),
      }).populate("examinationId", "maximumMarks");

      let scoredSum = 0;
      let maxPossibleSum = 0;

      marksDocs.forEach((m) => {
        if (m.examinationId) {
          scoredSum += m.obtainedMarks;
          maxPossibleSum += m.examinationId.maximumMarks;
        }
      });

      const marksPct = maxPossibleSum > 0 ? Number(((scoredSum / maxPossibleSum) * 100).toFixed(2)) : 0;

      // Correlation Classification
      let correlationCategory = "NORMAL";
      if (attendancePct >= 75 && marksPct >= 60) correlationCategory = "HIGH_ATTENDANCE_HIGH_SCORE";
      else if (attendancePct < 75 && marksPct < 50) correlationCategory = "LOW_ATTENDANCE_LOW_SCORE";
      else if (attendancePct < 75 && marksPct >= 60) correlationCategory = "LOW_ATTENDANCE_HIGH_SCORE";
      else if (attendancePct >= 75 && marksPct < 50) correlationCategory = "HIGH_ATTENDANCE_LOW_SCORE";

      return {
        studentId: student._id,
        rollNumber: student.rollNumber,
        name: student.userId.name,
        email: student.userId.email,
        attendancePercentage: attendancePct,
        academicPercentage: marksPct,
        correlationCategory,
      };
    })
  );

  // Sort cohort by academic percentage descending
  cohortRecords.sort((a, b) => b.academicPercentage - a.academicPercentage);

  return {
    totalStudents: cohortRecords.length,
    semester,
    cohort: cohortRecords,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. RULE-BASED ACADEMIC RISK DETECTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export const getAcademicRiskDetectionService = async ({
  departmentId,
  semester,
  academicSessionId,
  attendanceThreshold = 75,
  marksThreshold = 40,
}) => {
  const studentFilter = { status: "active" };
  if (departmentId) studentFilter.departmentId = departmentId;
  if (semester) studentFilter.currentSemester = parseInt(semester);

  const students = await Student.find(studentFilter)
    .populate("userId", "name email")
    .populate("departmentId", "name code");

  const riskReport = [];

  for (const student of students) {
    let riskScore = 0;
    const reasons = [];
    const recommendedActions = [];

    // ── RULE 1: ATTENDANCE SHORTAGE ──────────────────────────────────────────
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: "active",
      ...(academicSessionId ? { academicSessionId } : {}),
    }).populate("subjectId", "name code");

    let lowAttendanceSubjects = 0;
    let totalConductedAcrossSubjects = 0;
    let totalAttendedAcrossSubjects = 0;

    for (const enrollment of enrollments) {
      const subject = enrollment.subjectId;
      if (!subject) continue;

      const conducted = await ClassSession.countDocuments({
        subjectId: subject._id,
        isAttendanceSubmitted: true,
        ...(academicSessionId ? { academicSessionId } : {}),
      });

      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        subjectId: subject._id,
        ...(academicSessionId ? { academicSessionId } : {}),
      });

      const attendedCount = attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length;
      totalConductedAcrossSubjects += conducted;
      totalAttendedAcrossSubjects += attendedCount;

      const subjectPct = conducted > 0 ? (attendedCount / conducted) * 100 : 100;

      if (subjectPct < attendanceThreshold && conducted > 0) {
        lowAttendanceSubjects++;
        if (subjectPct < 60) {
          riskScore += 3; // Critical shortage
          reasons.push(`Critical attendance shortage in ${subject.code} (${subjectPct.toFixed(1)}% < 60%)`);
        } else {
          riskScore += 2; // Moderate shortage
          reasons.push(`Attendance shortage in ${subject.code} (${subjectPct.toFixed(1)}% < ${attendanceThreshold}%)`);
        }
      }
    }

    const overallAttendancePct =
      totalConductedAcrossSubjects > 0
        ? Number(((totalAttendedAcrossSubjects / totalConductedAcrossSubjects) * 100).toFixed(1))
        : 100;

    if (overallAttendancePct < attendanceThreshold && totalConductedAcrossSubjects > 0) {
      recommendedActions.push("Issue official attendance warning letter to student and guardian");
    }

    // ── RULE 2: EXAMINATION FAILURES ─────────────────────────────────────────
    const marksRecords = await Marks.find({
      studentId: student._id,
      ...(academicSessionId ? { academicSessionId } : {}),
    }).populate("examinationId", "name examType maximumMarks passMarks examDate")
      .populate("subjectId", "name code");

    let failedExamsCount = 0;
    let absentExamsCount = 0;

    for (const mark of marksRecords) {
      if (mark.isAbsent) {
        absentExamsCount++;
        riskScore += 2;
        reasons.push(`Absent in examination: ${mark.examinationId.name} (${mark.subjectId.code})`);
      } else if (mark.obtainedMarks < mark.examinationId.passMarks) {
        failedExamsCount++;
        riskScore += 3;
        reasons.push(
          `Failed ${mark.examinationId.name} in ${mark.subjectId.code} (Scored ${mark.obtainedMarks}/${mark.examinationId.maximumMarks})`
        );
      }
    }

    if (failedExamsCount > 0) {
      recommendedActions.push("Mandate remedial tutoring and remedial test sessions");
    }

    // ── RULE 3: DECLINING PERFORMANCE TREND ──────────────────────────────────
    // Group marks by subject and check if scores are decreasing chronologically
    const subjectMarksMap = {};
    marksRecords.forEach((m) => {
      const code = m.subjectId.code;
      if (!subjectMarksMap[code]) subjectMarksMap[code] = [];
      if (!m.isAbsent && m.examinationId) {
        const pct = (m.obtainedMarks / m.examinationId.maximumMarks) * 100;
        subjectMarksMap[code].push({
          examName: m.examinationId.name,
          date: m.examinationId.examDate || m.createdAt,
          percentage: pct,
        });
      }
    });

    for (const [subjCode, examsList] of Object.entries(subjectMarksMap)) {
      if (examsList.length >= 2) {
        // Sort chronologically
        examsList.sort((a, b) => new Date(a.date) - new Date(b.date));
        const prev = examsList[0].percentage;
        const current = examsList[examsList.length - 1].percentage;
        const drop = prev - current;

        // A drop of 10% or more between consecutive exams indicates declining trend
        if (drop >= 10) {
          riskScore += 2;
          reasons.push(
            `Declining academic trend in ${subjCode}: Dropped from ${prev.toFixed(1)}% to ${current.toFixed(1)}% (-${drop.toFixed(1)}%)`
          );
          recommendedActions.push(`Faculty counseling session for ${subjCode} academic decline`);
        }
      }
    }

    // ── RISK LEVEL CLASSIFICATION ────────────────────────────────────────────
    let riskLevel = "NORMAL";
    if (riskScore >= 5) riskLevel = "HIGH";
    else if (riskScore >= 3) riskLevel = "MEDIUM";
    else if (riskScore >= 1) riskLevel = "LOW";

    // Only include in report if student has at least LOW risk
    if (riskScore > 0) {
      riskReport.push({
        student: {
          _id: student._id,
          name: student.userId.name,
          email: student.userId.email,
          rollNumber: student.rollNumber,
          department: student.departmentId.name,
          semester: student.currentSemester,
        },
        riskScore,
        riskLevel,
        metrics: {
          overallAttendancePercentage: overallAttendancePct,
          lowAttendanceSubjectsCount: lowAttendanceSubjects,
          failedExaminationsCount: failedExamsCount,
          absentExaminationsCount: absentExamsCount,
        },
        reasons,
        recommendedActions: [...new Set(recommendedActions)], // remove duplicate suggestions
      });
    }
  }

  // Sort by riskScore descending (highest risk first)
  riskReport.sort((a, b) => b.riskScore - a.riskScore);

  return {
    totalAtRiskStudents: riskReport.length,
    highRiskCount: riskReport.filter((r) => r.riskLevel === "HIGH").length,
    mediumRiskCount: riskReport.filter((r) => r.riskLevel === "MEDIUM").length,
    lowRiskCount: riskReport.filter((r) => r.riskLevel === "LOW").length,
    riskReport,
  };
};

