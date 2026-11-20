import { Examination, Student, Marks, Enrollment } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import { calculateGrade, calculateSGPA } from "../utils/gradeCalculator.js";
import {
  createExaminationService,
  getExaminationsService,
  submitMarksService,
  updateSingleMarksService,
  lockExaminationService,
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

export const lockExamination = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const result = await lockExaminationService(examId, req.user);
    res.status(200).json(
      new ApiResponse(200, "Examination marks locked successfully.", result)
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

export const getStudentPerformance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { semester, academicSessionId } = req.query;

    const student = await Student.findById(studentId)
      .populate("userId", "name email")
      .populate("departmentId", "name code");

    if (!student) {
      throw new ApiError(404, "Student profile not found.");
    }

    // Access control: student can only view their own performance
    if (req.user.role === "student" && student.userId._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied. You can only view your own academic performance.");
    }

    const targetSemester = semester ? parseInt(semester) : student.currentSemester;

    const marksFilter = { studentId: student._id };
    if (academicSessionId) {
      marksFilter.academicSessionId = academicSessionId;
    }

    const marksRecords = await Marks.find(marksFilter)
      .populate({
        path: "examinationId",
        populate: { path: "subjectId", select: "name code credits semester" },
      })
      .populate("subjectId", "name code credits semester")
      .populate("academicSessionId", "label year");

    // Filter by semester if specified or student semester
    const filteredMarks = marksRecords.filter((m) => {
      const sem = m.subjectId?.semester || m.examinationId?.semester;
      return !targetSemester || !sem || sem === targetSemester;
    });

    const formattedRecords = filteredMarks.map((m) => {
      const exam = m.examinationId || {};
      const subject = m.subjectId || exam.subjectId || {};
      const maxMarks = exam.maximumMarks || 100;
      const evaluation = calculateGrade(m.obtainedMarks, maxMarks);
      const isAbsent = Boolean(m.isAbsent);
      const isPass = !isAbsent && m.obtainedMarks >= (exam.passMarks || 40);

      return {
        _id: m._id,
        examinationId: exam._id,
        examination: {
          _id: exam._id,
          name: exam.name || "Assessment",
          examType: exam.examType || "Exam",
          maximumMarks: maxMarks,
          passMarks: exam.passMarks || 40,
          weightage: exam.weightage || 30,
          subject: {
            _id: subject._id,
            name: subject.name || "Subject",
            code: subject.code || "",
          },
        },
        subject: {
          _id: subject._id,
          name: subject.name || "Subject",
          code: subject.code || "",
          credits: subject.credits || 3,
          semester: subject.semester,
        },
        marksObtained: m.obtainedMarks,
        score: m.obtainedMarks,
        maximumMarks: maxMarks,
        percentage: evaluation.percentage,
        grade: isAbsent ? "F" : evaluation.grade,
        gradePoint: isAbsent ? 0 : evaluation.gradePoint,
        isPassed: isPass,
        isAbsent,
        remarks: m.remarks,
      };
    });

    // Subject mapping to compute SGPA
    const subjectCourseMap = new Map();
    formattedRecords.forEach((rec) => {
      const sId = rec.subject?._id?.toString() || "unknown";
      if (!subjectCourseMap.has(sId)) {
        subjectCourseMap.set(sId, {
          credits: rec.subject?.credits || 3,
          gradePoints: [],
        });
      }
      subjectCourseMap.get(sId).gradePoints.push(rec.gradePoint);
    });

    // Fetch active enrollments for this semester to verify completeness
    const enrollmentFilter = {
      studentId: student._id,
      status: "active",
      ...(targetSemester ? { semester: targetSemester } : {}),
    };
    if (academicSessionId) {
      enrollmentFilter.academicSessionId = academicSessionId;
    }

    let enrollments = await Enrollment.find(enrollmentFilter).populate("subjectId");
    if (!enrollments.length && academicSessionId) {
      enrollments = await Enrollment.find({
        studentId: student._id,
        status: "active",
        ...(targetSemester ? { semester: targetSemester } : {}),
      }).populate("subjectId");
    }
    enrollments = enrollments.filter((e) => e.subjectId);

    const evaluatedSubjectIds = new Set(
      formattedRecords
        .filter((r) => r.subject?._id)
        .map((r) => r.subject._id.toString())
    );

    // Any enrolled subject without marks is included with PENDING status
    // It will NEVER default to 0 / F
    const pendingCourseRecords = [];
    enrollments.forEach((e) => {
      const sId = e.subjectId._id.toString();
      if (!evaluatedSubjectIds.has(sId)) {
        pendingCourseRecords.push({
          _id: `pending_${sId}`,
          examinationId: null,
          examination: {
            name: "Semester Evaluation",
            examType: "Semester Exam",
            maximumMarks: 100,
            passMarks: 40,
            weightage: 100,
            subject: {
              _id: e.subjectId._id,
              name: e.subjectId.name,
              code: e.subjectId.code,
            },
          },
          subject: {
            _id: e.subjectId._id,
            name: e.subjectId.name,
            code: e.subjectId.code,
            credits: e.subjectId.credits || 3,
            semester: e.subjectId.semester,
          },
          marksObtained: null,
          score: null,
          maximumMarks: null,
          percentage: null,
          grade: "PENDING",
          gradePoint: null,
          isPassed: null,
          isAbsent: false,
          isPending: true,
          remarks: "Awaiting evaluation",
        });
      }
    });

    const allRecords = [...formattedRecords, ...pendingCourseRecords];

    const totalEnrolledCount = enrollments.length;
    const evaluatedCount = evaluatedSubjectIds.size;
    const isComplete = totalEnrolledCount > 0 && evaluatedCount >= totalEnrolledCount;

    let totalCredits = 0;
    enrollments.forEach((e) => {
      if (e.subjectId?.credits) totalCredits += e.subjectId.credits;
    });

    if (totalCredits === 0) {
      subjectCourseMap.forEach((val) => {
        totalCredits += val.credits;
      });
    }

    let calculatedSgpa = null;
    let evaluationStatus = "PENDING";

    // SGPA is calculated ONLY when all enrolled subjects have been graded
    if (isComplete) {
      const coursesForSgpa = [];
      subjectCourseMap.forEach((val) => {
        const avgGp =
          val.gradePoints.length > 0
            ? val.gradePoints.reduce((a, b) => a + b, 0) / val.gradePoints.length
            : 0;
        coursesForSgpa.push({ credits: val.credits, gradePoint: avgGp });
      });
      calculatedSgpa = coursesForSgpa.length > 0 ? calculateSGPA(coursesForSgpa) : null;
      evaluationStatus = "PUBLISHED";
    }

    res.status(200).json(
      new ApiResponse(200, "Student academic performance fetched successfully.", {
        sgpa: isComplete ? calculatedSgpa : null,
        isComplete,
        evaluationStatus,
        totalEnrolledCourses: totalEnrolledCount,
        evaluatedCoursesCount: evaluatedCount,
        pendingCoursesCount: Math.max(0, totalEnrolledCount - evaluatedCount),
        totalCredits,
        records: allRecords,
        marks: allRecords,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMyPerformance = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");
    req.params.studentId = student._id.toString();
    return getStudentPerformance(req, res, next);
  } catch (error) {
    next(error);
  }
};

