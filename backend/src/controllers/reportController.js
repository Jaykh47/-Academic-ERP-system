import { Student, Enrollment, AcademicSession } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import {
  generateStudentReportCardPDF,
  generateSubjectAttendancePDF,
  generateSubjectAttendanceExcel,
  generateExaminationResultsExcel,
} from "../services/reportService.js";

/**
 * REPORT CONTROLLER
 *
 * REST endpoints for streaming formatted PDF reports and Excel workbooks.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. STUDENT REPORT CARD (PDF)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadStudentReportCardPDF = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) throw new ApiError(404, "Student profile not found.");

    // Resource check: Student can only download their own report card
    if (req.user.role === "student" && student.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied. You can only download your own report card.");
    }

    const semester = req.query.semester ? parseInt(req.query.semester, 10) : (student.currentSemester || 1);
    let academicSessionId = req.query.academicSessionId;

    if (!academicSessionId) {
      const activeEnrollment = await Enrollment.findOne({ studentId: student._id, semester, status: "active" });
      if (activeEnrollment?.academicSessionId) {
        academicSessionId = activeEnrollment.academicSessionId;
      } else {
        const curSession = await AcademicSession.findOne({ isCurrent: true });
        academicSessionId = curSession?._id || student.admissionSessionId;
      }
    }

    const pdfBuffer = await generateStudentReportCardPDF(studentId, semester, academicSessionId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report_card_${student.rollNumber || studentId}_sem${semester}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const downloadMyReportCardPDF = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");

    const semester = req.query.semester ? parseInt(req.query.semester, 10) : (student.currentSemester || 1);
    let academicSessionId = req.query.academicSessionId;

    if (!academicSessionId) {
      const activeEnrollment = await Enrollment.findOne({ studentId: student._id, semester, status: "active" });
      if (activeEnrollment?.academicSessionId) {
        academicSessionId = activeEnrollment.academicSessionId;
      } else {
        const curSession = await AcademicSession.findOne({ isCurrent: true });
        academicSessionId = curSession?._id || student.admissionSessionId;
      }
    }

    const pdfBuffer = await generateStudentReportCardPDF(student._id, semester, academicSessionId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report_card_${student.rollNumber}_sem${semester}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUBJECT ATTENDANCE ROSTER (PDF)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadSubjectAttendancePDF = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicSessionId } = req.query;

    const pdfBuffer = await generateSubjectAttendancePDF(subjectId, academicSessionId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="attendance_report_${subjectId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUBJECT ATTENDANCE (EXCEL)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadSubjectAttendanceExcel = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicSessionId } = req.query;

    const excelBuffer = await generateSubjectAttendanceExcel(subjectId, academicSessionId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="attendance_${subjectId}.xlsx"`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.end(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXAMINATION RESULTS (EXCEL)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadExaminationResultsExcel = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const excelBuffer = await generateExaminationResultsExcel(examId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="exam_results_${examId}.xlsx"`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.end(excelBuffer);
  } catch (error) {
    next(error);
  }
};

