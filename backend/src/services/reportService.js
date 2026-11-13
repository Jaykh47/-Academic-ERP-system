import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import {
  Student,
  Subject,
  Department,
  ClassSession,
  Attendance,
  Examination,
  Marks,
  Enrollment,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { calculateGrade, calculateSGPA } from "../utils/gradeCalculator.js";
import { getSubjectAttendanceSummaryService } from "./attendanceService.js";
import { getStudentSemesterReportService } from "./marksService.js";

/**
 * REPORT GENERATION SERVICE
 *
 * Implements high-quality PDF document creation and Excel workbook exports:
 * 1. Student Semester Grade Sheet / Report Card (PDF)
 * 2. Course Attendance Summary & Eligibility Sheet (PDF)
 * 3. Course Attendance Roster (Excel .xlsx)
 * 4. Examination Results Sheet (Excel .xlsx)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. GENERATE STUDENT REPORT CARD (PDF)
// ─────────────────────────────────────────────────────────────────────────────
export const generateStudentReportCardPDF = async (studentId, semester, academicSessionId) => {
  const reportData = await getStudentSemesterReportService(studentId, semester, academicSessionId);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // ── Header ────────────────────────────────────────────────────────────
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("COLLEGE OF COMPUTER APPLICATIONS & TECHNOLOGY", { align: "center" });

      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Official Academic Progress & Examination Grade Sheet", { align: "center" });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#333333").stroke();
      doc.moveDown(1);

      // ── Student Info Block ────────────────────────────────────────────────
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(`Student Name: `, 40, doc.y, { continued: true }).font("Helvetica").text(reportData.student.name);
      doc.font("Helvetica-Bold").text(`Roll Number:  `, 320, doc.y - 12, { continued: true }).font("Helvetica").text(reportData.student.rollNumber);

      doc.font("Helvetica-Bold").text(`Department:   `, 40, doc.y + 4, { continued: true }).font("Helvetica").text(reportData.student.department);
      doc.font("Helvetica-Bold").text(`Enrollment:   `, 320, doc.y - 12, { continued: true }).font("Helvetica").text(reportData.student.enrollmentNumber);

      doc.font("Helvetica-Bold").text(`Semester:     `, 40, doc.y + 4, { continued: true }).font("Helvetica").text(`Semester ${reportData.student.semester}`);
      doc.font("Helvetica-Bold").text(`Result Date:  `, 320, doc.y - 12, { continued: true }).font("Helvetica").text(new Date().toLocaleDateString());

      doc.moveDown(1.5);

      // ── Table Header ──────────────────────────────────────────────────────
      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 22).fillColor("#2B4C7E").fill();

      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
      doc.text("CODE", 45, tableTop + 6, { width: 60 });
      doc.text("COURSE TITLE", 110, tableTop + 6, { width: 175 });
      doc.text("CREDITS", 290, tableTop + 6, { width: 50, align: "center" });
      doc.text("SCORE", 345, tableTop + 6, { width: 65, align: "center" });
      doc.text("GRADE", 415, tableTop + 6, { width: 45, align: "center" });
      doc.text("POINT", 465, tableTop + 6, { width: 40, align: "center" });
      doc.text("STATUS", 510, tableTop + 6, { width: 40, align: "center" });

      // ── Table Rows ────────────────────────────────────────────────────────
      let currentY = tableTop + 24;
      doc.font("Helvetica").fontSize(9).fillColor("#222222");

      reportData.subjects.forEach((sub, index) => {
        const rowBg = index % 2 === 0 ? "#F9F9F9" : "#FFFFFF";
        doc.rect(40, currentY, 515, 20).fillColor(rowBg).fill();

        doc.fillColor("#222222");
        doc.text(sub.code, 45, currentY + 5, { width: 60 });
        doc.text(sub.name, 110, currentY + 5, { width: 175 });
        doc.text(String(sub.credits), 290, currentY + 5, { width: 50, align: "center" });
        doc.text(`${sub.totalObtainedMarks}/${sub.totalMaxMarks}`, 345, currentY + 5, { width: 65, align: "center" });
        doc.text(sub.grade, 415, currentY + 5, { width: 45, align: "center" });
        doc.text(String(sub.gradePoint), 465, currentY + 5, { width: 40, align: "center" });

        const statusColor = sub.isPassed ? "#2E7D32" : "#C62828";
        doc.fillColor(statusColor).font("Helvetica-Bold");
        doc.text(sub.isPassed ? "PASS" : "FAIL", 510, currentY + 5, { width: 40, align: "center" });

        doc.font("Helvetica").fillColor("#222222");
        currentY += 20;
      });

      // ── Summary Box ───────────────────────────────────────────────────────
      doc.moveDown(2);
      const summaryY = currentY + 15;

      doc.rect(40, summaryY, 515, 65).fillColor("#F0F4F8").strokeColor("#2B4C7E").lineWidth(1).fillAndStroke();

      doc.fillColor("#1A202C").font("Helvetica-Bold").fontSize(11);
      doc.text("SEMESTER ACADEMIC SUMMARY", 50, summaryY + 10);

      doc.font("Helvetica").fontSize(10);
      doc.text(`Total Earned Credits: ${reportData.academicSummary.totalCredits}`, 50, summaryY + 28);
      doc.text(`Result Status:        ${reportData.academicSummary.resultStatus}`, 50, summaryY + 44);

      doc.font("Helvetica-Bold").fontSize(14).fillColor("#2B4C7E");
      doc.text(`SGPA: ${reportData.academicSummary.sgpa}`, 380, summaryY + 28, { align: "right", width: 160 });

      // ── Footer / Signature ────────────────────────────────────────────────
      doc.moveDown(4);
      const footerY = summaryY + 110;
      doc.font("Helvetica").fontSize(9).fillColor("#666666");
      doc.text("Controller of Examinations", 60, footerY);
      doc.text("Head of Department", 400, footerY);

      doc.text("This is a computer-generated transcript issued by the Academic Progress Tracker.", 40, footerY + 30, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GENERATE SUBJECT ATTENDANCE ROSTER (PDF)
// ─────────────────────────────────────────────────────────────────────────────
export const generateSubjectAttendancePDF = async (subjectId, academicSessionId) => {
  const summary = await getSubjectAttendanceSummaryService(subjectId, academicSessionId);
  const subject = await Subject.findById(subjectId).populate("departmentId").populate({
    path: "assignedFaculty",
    populate: { path: "userId" },
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(16).font("Helvetica-Bold").text("OFFICIAL ATTENDANCE ELIGIBILITY REPORT", { align: "center" });
      doc.fontSize(11).font("Helvetica").text(`${subject.name} (${subject.code}) - Semester ${subject.semester}`, { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#333333").stroke();
      doc.moveDown(1);

      // Course Details
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Department: ", 40, doc.y, { continued: true }).font("Helvetica").text(subject.departmentId.name);
      doc.font("Helvetica-Bold").text("Conducted Classes: ", 340, doc.y - 12, { continued: true }).font("Helvetica").text(String(summary.totalConductedClasses));

      doc.font("Helvetica-Bold").text("Instructor: ", 40, doc.y + 4, { continued: true }).font("Helvetica").text(subject.assignedFaculty?.userId?.name || "Unassigned");
      doc.font("Helvetica-Bold").text("Shortage Threshold: ", 340, doc.y - 12, { continued: true }).font("Helvetica").text("75.0%");

      doc.moveDown(1.5);

      // Table Header
      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 20).fillColor("#2B4C7E").fill();

      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
      doc.text("ROLL NO", 45, tableTop + 5, { width: 70 });
      doc.text("STUDENT NAME", 120, tableTop + 5, { width: 170 });
      doc.text("PRESENT", 295, tableTop + 5, { width: 55, align: "center" });
      doc.text("ABSENT", 355, tableTop + 5, { width: 50, align: "center" });
      doc.text("ATTEND %", 410, tableTop + 5, { width: 60, align: "center" });
      doc.text("ELIGIBILITY", 475, tableTop + 5, { width: 75, align: "center" });

      let currentY = tableTop + 22;
      doc.font("Helvetica").fontSize(9).fillColor("#222222");

      summary.students.forEach((stu, index) => {
        const rowBg = index % 2 === 0 ? "#F9F9F9" : "#FFFFFF";
        doc.rect(40, currentY, 515, 20).fillColor(rowBg).fill();

        doc.fillColor("#222222");
        doc.text(stu.rollNumber, 45, currentY + 5, { width: 70 });
        doc.text(stu.name, 120, currentY + 5, { width: 170 });
        doc.text(String(stu.totalPresent + stu.totalLate), 295, currentY + 5, { width: 55, align: "center" });
        doc.text(String(stu.totalAbsent), 355, currentY + 5, { width: 50, align: "center" });
        doc.text(`${stu.attendancePercentage}%`, 410, currentY + 5, { width: 60, align: "center" });

        const isShortage = stu.isShortage;
        doc.fillColor(isShortage ? "#C62828" : "#2E7D32").font("Helvetica-Bold");
        doc.text(isShortage ? "DETAINED" : "ELIGIBLE", 475, currentY + 5, { width: 75, align: "center" });

        doc.font("Helvetica").fillColor("#222222");
        currentY += 20;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GENERATE SUBJECT ATTENDANCE (EXCEL .xlsx)
// ─────────────────────────────────────────────────────────────────────────────
export const generateSubjectAttendanceExcel = async (subjectId, academicSessionId) => {
  const summary = await getSubjectAttendanceSummaryService(subjectId, academicSessionId);
  const subject = await Subject.findById(subjectId).populate("departmentId").populate({
    path: "assignedFaculty",
    populate: { path: "userId" },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Summary");

  // Metadata headers
  worksheet.addRow(["COLLEGE ATTENDANCE AND ACADEMIC PROGRESS TRACKER"]);
  worksheet.addRow([`Course: ${subject.name} (${subject.code})`, "", `Department: ${subject.departmentId.name}`]);
  worksheet.addRow([`Instructor: ${subject.assignedFaculty?.userId?.name || "Unassigned"}`, "", `Total Classes Conducted: ${summary.totalConductedClasses}`]);
  worksheet.addRow([]); // Blank spacer

  // Format title row
  worksheet.mergeCells("A1:G1");
  const titleCell = worksheet.getCell("A1");
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B4C7E" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 28;

  // Table header
  const headerRow = worksheet.addRow([
    "Roll Number",
    "Student Name",
    "Email",
    "Present",
    "Late",
    "Absent",
    "Attendance %",
    "Eligibility Status",
  ]);

  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334E68" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Data rows
  summary.students.forEach((stu) => {
    const row = worksheet.addRow([
      stu.rollNumber,
      stu.name,
      stu.email,
      stu.totalPresent,
      stu.totalLate,
      stu.totalAbsent,
      stu.attendancePercentage,
      stu.isShortage ? "DETAINED (<75%)" : "ELIGIBLE",
    ]);

    // Color code eligibility status
    const statusCell = row.getCell(8);
    statusCell.font = { bold: true, color: { argb: stu.isShortage ? "FFC62828" : "FF2E7D32" } };
  });

  // Auto-fit column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = maxLength + 3;
  });

  return await workbook.xlsx.writeBuffer();
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GENERATE EXAMINATION RESULTS (EXCEL .xlsx)
// ─────────────────────────────────────────────────────────────────────────────
export const generateExaminationResultsExcel = async (examinationId) => {
  const exam = await Examination.findById(examinationId).populate("subjectId").populate("academicSessionId");
  if (!exam) throw new ApiError(404, "Examination not found.");

  const marksRecords = await Marks.find({ examinationId: exam._id })
    .populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ obtainedMarks: -1 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Exam Results");

  worksheet.addRow(["COLLEGE EXAMINATION MARKS & RESULT SHEET"]);
  worksheet.addRow([`Exam: ${exam.name}`, "", `Course: ${exam.subjectId.name} (${exam.subjectId.code})`]);
  worksheet.addRow([`Max Marks: ${exam.maximumMarks}`, "", `Pass Marks: ${exam.passMarks}`]);
  worksheet.addRow([]);

  worksheet.mergeCells("A1:G1");
  const titleCell = worksheet.getCell("A1");
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 28;

  const headerRow = worksheet.addRow([
    "Roll Number",
    "Student Name",
    "Score",
    "Max Marks",
    "Percentage %",
    "Grade",
    "Result Status",
  ]);

  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  marksRecords.forEach((m) => {
    const isAbsent = m.isAbsent;
    const score = m.obtainedMarks;
    const evaluation = calculateGrade(score, exam.maximumMarks);
    const passed = !isAbsent && score >= exam.passMarks;

    const row = worksheet.addRow([
      m.studentId.rollNumber,
      m.studentId.userId.name,
      isAbsent ? "ABSENT" : score,
      exam.maximumMarks,
      isAbsent ? 0 : evaluation.percentage,
      isAbsent ? "F" : evaluation.grade,
      passed ? "PASSED" : "FAILED",
    ]);

    const resultCell = row.getCell(7);
    resultCell.font = { bold: true, color: { argb: passed ? "FF16A34A" : "FFDC2626" } };
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = maxLength + 3;
  });

  return await workbook.xlsx.writeBuffer();
};

