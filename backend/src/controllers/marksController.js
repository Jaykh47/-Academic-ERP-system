import { Examination, Student } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import {
  createExaminationService,
  getExaminationsService,
  submitMarksService,
  updateSingleMarksService,
  getExaminationResultsService,
  getStudentSemesterReportService,
} from "../services/marksService.js";

/**
 * MARKS & EXAMINATION CONTROLLER
 *
 * Exposes endpoints for managing academic assessments,
 * student scores, grade calculations, and semester result sheets.
 */

// ── EXAMINATIONS ─────────────────────────────────────────────────────────────

export const createExamination = async (req, res, next) => {
  try {
    const exam = await createExaminationService(req.body, req.user);
    res.status(201).json(
      new ApiResponse(201, "Examination created successfully.", { examination: exam })
    );
  } catch (error) {
    next(error);
  }
};

export const getExaminations = async (req, res, next) => {
  try {
    const { subjectId, semester, academicSessionId, examType } = req.query;

    const filter = { isActive: true };
    if (subjectId) filter.subjectId = subjectId;
    if (semester) filter.semester = parseInt(semester);
    if (academicSessionId) filter.academicSessionId = academicSessionId;
    if (examType) filter.examType = examType;

    const examinations = await getExaminationsService(filter);

    res.status(200).json(
      new ApiResponse(200, "Examinations fetched successfully.", {
        total: examinations.length,
        examinations,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getExaminationById = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Examination.findById(examId)
      .populate("subjectId", "name code semester credits")
      .populate("academicSessionId", "label")
      .populate({
        path: "createdBy",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      });

    if (!exam) throw new ApiError(404, "Examination not found.");

    res.status(200).json(
      new ApiResponse(200, "Examination fetched successfully.", { examination: exam })
    );
  } catch (error) {
    next(error);
  }
};

// ── MARKS UPLOAD & AUDIT EDIT ────────────────────────────────────────────────

export const submitMarks = async (req, res, next) => {
  try {
    const result = await submitMarksService(req.body, req.user);
    res.status(200).json(
      new ApiResponse(200, "Marks submitted successfully.", result)
    );
  } catch (error) {
    next(error);
  }
};

export const updateSingleMarks = async (req, res, next) => {
  try {
    const { marksId } = req.params;
    const updated = await updateSingleMarksService(marksId, req.body, req.user);

    res.status(200).json(
      new ApiResponse(200, "Marks updated successfully.", { marks: updated })
    );
  } catch (error) {
    next(error);
  }
};

// ── RESULTS & REPORT CARDS ───────────────────────────────────────────────────

export const getExaminationResults = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const results = await getExaminationResultsService(examId);

    res.status(200).json(
      new ApiResponse(200, "Examination result sheet fetched successfully.", results)
    );
  } catch (error) {
    next(error);
  }
};

export const getStudentSemesterReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { semester, academicSessionId } = req.query;

    if (!semester || !academicSessionId) {
      throw new ApiError(400, "Both 'semester' and 'academicSessionId' query parameters are required.");
    }

    // Resource-level check for students
    if (req.user.role === "student") {
      const student = await Student.findById(studentId);
      if (!student || student.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied. You can only view your own report card.");
      }
    }

    const report = await getStudentSemesterReportService(
      studentId,
      parseInt(semester),
      academicSessionId
    );

    res.status(200).json(
      new ApiResponse(200, "Semester report card generated successfully.", report)
    );
  } catch (error) {
    next(error);
  }
};

export const getMySemesterReport = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");

    const { semester, academicSessionId } = req.query;
    if (!semester || !academicSessionId) {
      throw new ApiError(400, "Both 'semester' and 'academicSessionId' query parameters are required.");
    }

    const report = await getStudentSemesterReportService(
      student._id,
      parseInt(semester),
      academicSessionId
    );

    res.status(200).json(
      new ApiResponse(200, "Personal semester report card generated successfully.", report)
    );
  } catch (error) {
    next(error);
  }
};

