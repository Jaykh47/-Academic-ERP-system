import { ClassSession, Attendance, Student } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import {
  createClassSessionService,
  submitAttendanceService,
  correctAttendanceService,
  getSubjectAttendanceSummaryService,
  getStudentFullAttendanceService,
  getAttendanceShortageReportService,
} from "../services/attendanceService.js";

/**
 * ATTENDANCE CONTROLLER
 *
 * Handles HTTP requests for class sessions, attendance marking,
 * audit corrections, and statistical reporting.
 */

// ── CLASS SESSIONS ───────────────────────────────────────────────────────────

export const createClassSession = async (req, res, next) => {
  try {
    const session = await createClassSessionService(req.body, req.user);
    res.status(201).json(
      new ApiResponse(201, "Class session scheduled successfully.", { session })
    );
  } catch (error) {
    next(error);
  }
};

export const getAllClassSessions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { subjectId, facultyId, date, academicSessionId, status } = req.query;

    const filter = {};
    if (subjectId) filter.subjectId = subjectId;
    if (facultyId) filter.facultyId = facultyId;
    if (academicSessionId) filter.academicSessionId = academicSessionId;
    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    }

    const [sessions, total] = await Promise.all([
      ClassSession.find(filter)
        .populate("subjectId", "name code semester")
        .populate({
          path: "facultyId",
          select: "employeeId designation userId",
          populate: { path: "userId", select: "name email" },
        })
        .populate("academicSessionId", "label")
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(limit),
      ClassSession.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Class sessions fetched successfully.", {
        sessions,
        pagination: buildPaginationMeta(page, limit, total),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getClassSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ClassSession.findById(sessionId)
      .populate("subjectId", "name code semester")
      .populate({
        path: "facultyId",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      })
      .populate("academicSessionId", "label");

    if (!session) throw new ApiError(404, "Class session not found.");

    let attendanceRecords = [];
    if (session.isAttendanceSubmitted) {
      const records = await Attendance.find({ classSessionId: session._id })
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name email isActive" },
        })
        .sort({ "studentId.rollNumber": 1 });

      attendanceRecords = records.map((r) => {
        const obj = r.toObject ? r.toObject() : r;
        const student = obj.studentId || {};
        const user = student.userId || {};
        return {
          ...obj,
          student: {
            ...student,
            name: user.name || "",
            email: user.email || "",
          },
          studentName: user.name || "",
          studentEmail: user.email || "",
          rollNumber: student.rollNumber || "",
        };
      });
    }

    res.status(200).json(
      new ApiResponse(200, "Class session details fetched successfully.", {
        session,
        attendanceRecords,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ── ATTENDANCE SUBMISSION & CORRECTION ────────────────────────────────────────

export const submitAttendance = async (req, res, next) => {
  try {
    const result = await submitAttendanceService(req.body, req.user);
    res.status(200).json(
      new ApiResponse(200, "Attendance submitted and locked successfully.", result)
    );
  } catch (error) {
    next(error);
  }
};

export const correctAttendance = async (req, res, next) => {
  try {
    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    const updated = await correctAttendanceService(attendanceId, { status, remarks }, req.user);

    res.status(200).json(
      new ApiResponse(200, "Attendance record corrected successfully.", { attendance: updated })
    );
  } catch (error) {
    next(error);
  }
};

// ── STATISTICAL & REPORTING ENDPOINTS ─────────────────────────────────────────

export const getSubjectAttendanceSummary = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicSessionId, lateWeight } = req.query;

    const summary = await getSubjectAttendanceSummaryService(
      subjectId,
      academicSessionId,
      lateWeight ? parseFloat(lateWeight) : 1.0
    );

    res.status(200).json(
      new ApiResponse(200, "Subject attendance summary calculated successfully.", summary)
    );
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");

    const { academicSessionId, lateWeight } = req.query;
    const breakdown = await getStudentFullAttendanceService(
      student._id,
      academicSessionId,
      lateWeight ? parseFloat(lateWeight) : 1.0
    );

    res.status(200).json(
      new ApiResponse(200, "Personal attendance report fetched successfully.", breakdown)
    );
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicSessionId, lateWeight } = req.query;

    // Resource check: Student can only view their own attendance
    if (req.user.role === "student") {
      const student = await Student.findById(studentId);
      if (!student || student.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied. You can only view your own attendance.");
      }
    }

    const breakdown = await getStudentFullAttendanceService(
      studentId,
      academicSessionId,
      lateWeight ? parseFloat(lateWeight) : 1.0
    );

    res.status(200).json(
      new ApiResponse(200, "Student attendance report fetched successfully.", breakdown)
    );
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicSessionId, lateWeight } = req.query;

    if (req.user.role === "student") {
      const student = await Student.findById(studentId);
      if (!student || student.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied. You can only view your own attendance.");
      }
    }

    const breakdown = await getStudentFullAttendanceService(
      studentId,
      academicSessionId,
      lateWeight ? parseFloat(lateWeight) : 1.0
    );

    const summary = {
      overallPercentage: breakdown.overallStats?.overallPercentage ?? 100,
      totalClasses: breakdown.overallStats?.totalConductedClasses ?? 0,
      totalAttended: breakdown.overallStats?.totalAttendedClasses ?? 0,
      isShortage: breakdown.overallStats?.isOverallShortage ?? false,
      subjectWise: (breakdown.subjectBreakdown || []).map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.name,
        subjectCode: s.code,
        semester: s.semester,
        credits: s.credits,
        total: s.totalConductedClasses || 0,
        attended: (s.totalPresent || 0) + (s.totalLate || 0),
        present: s.totalPresent || 0,
        late: s.totalLate || 0,
        absent: s.totalAbsent || 0,
        percentage: s.attendancePercentage ?? 100,
        isShortage: s.isShortage ?? false,
        classesNeededFor75: s.classesNeededFor75 || 0,
      })),
    };

    res.status(200).json(
      new ApiResponse(200, "Attendance summary fetched successfully.", { summary })
    );
  } catch (error) {
    next(error);
  }
};

export const getPredictiveRecovery = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicSessionId, lateWeight } = req.query;

    if (req.user.role === "student") {
      const student = await Student.findById(studentId);
      if (!student || student.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied. You can only view your own attendance.");
      }
    }

    const breakdown = await getStudentFullAttendanceService(
      studentId,
      academicSessionId,
      lateWeight ? parseFloat(lateWeight) : 1.0
    );

    const predictions = (breakdown.subjectBreakdown || []).map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.name,
      subjectCode: s.code,
      currentPercentage: s.attendancePercentage ?? 100,
      totalConducted: s.totalConductedClasses || 0,
      totalAttended: (s.totalPresent || 0) + (s.totalLate || 0),
      classesNeededToReach75: s.classesNeededFor75 || 0,
      isShortage: s.isShortage ?? false,
    }));

    res.status(200).json(
      new ApiResponse(200, "Predictive recovery model generated successfully.", { predictions })
    );
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");
    req.params.studentId = student._id.toString();
    return getStudentAttendanceSummary(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getMyPredictiveRecovery = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");
    req.params.studentId = student._id.toString();
    return getPredictiveRecovery(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceShortageReport = async (req, res, next) => {
  try {
    const { departmentId, semester, academicSessionId, threshold } = req.query;

    const report = await getAttendanceShortageReportService({
      departmentId,
      semester,
      academicSessionId,
      threshold: threshold ? parseFloat(threshold) : 75.0,
    });

    res.status(200).json(
      new ApiResponse(200, "Attendance shortage report generated successfully.", report)
    );
  } catch (error) {
    next(error);
  }
};

