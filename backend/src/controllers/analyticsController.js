import { Department, Subject, Faculty } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {
  getDepartmentAnalyticsService,
  getSubjectAnalyticsService,
  getCohortAnalyticsService,
  getAcademicRiskDetectionService,
} from "../services/analyticsService.js";

/**
 * ANALYTICS CONTROLLER
 *
 * REST endpoint controllers for institutional intelligence,
 * department dashboards, subject analytics, and academic risk detection.
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/analytics/department/:departmentId
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartmentAnalytics = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { academicSessionId } = req.query;

    // Resource-level check for HOD: Can only access their own department
    if (req.user.role === "hod") {
      const hodProfile = await Faculty.findOne({ userId: req.user._id });
      if (!hodProfile || hodProfile.departmentId.toString() !== departmentId.toString()) {
        throw new ApiError(403, "Access denied. HODs can only access analytics for their assigned department.");
      }
    }

    const analytics = await getDepartmentAnalyticsService(departmentId, academicSessionId);

    res.status(200).json(
      new ApiResponse(200, "Department analytics fetched successfully.", analytics)
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/analytics/subject/:subjectId
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectAnalytics = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicSessionId } = req.query;

    const subject = await Subject.findById(subjectId);
    if (!subject) throw new ApiError(404, "Subject not found.");

    // Resource check: HOD can only inspect subjects in their department
    if (req.user.role === "hod") {
      const hodProfile = await Faculty.findOne({ userId: req.user._id });
      if (!hodProfile || hodProfile.departmentId.toString() !== subject.departmentId.toString()) {
        throw new ApiError(403, "Access denied. HODs can only view subjects in their department.");
      }
    }

    const analytics = await getSubjectAnalyticsService(subjectId, academicSessionId);

    res.status(200).json(
      new ApiResponse(200, "Subject analytics fetched successfully.", analytics)
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/analytics/cohort
// Query params: ?departmentId=...&semester=1&academicSessionId=...
// ─────────────────────────────────────────────────────────────────────────────
export const getCohortAnalytics = async (req, res, next) => {
  try {
    const { departmentId, semester, academicSessionId } = req.query;

    if (!departmentId || !semester) {
      throw new ApiError(400, "Both 'departmentId' and 'semester' query parameters are required.");
    }

    // Resource check for HOD
    if (req.user.role === "hod") {
      const hodProfile = await Faculty.findOne({ userId: req.user._id });
      if (!hodProfile || hodProfile.departmentId.toString() !== departmentId.toString()) {
        throw new ApiError(403, "Access denied. HODs can only view cohort analytics for their department.");
      }
    }

    const analytics = await getCohortAnalyticsService({
      departmentId,
      semester: parseInt(semester),
      academicSessionId,
    });

    res.status(200).json(
      new ApiResponse(200, "Cohort analytics fetched successfully.", analytics)
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/analytics/risk-detection
// Query params: ?departmentId=...&semester=1&attendanceThreshold=75&marksThreshold=40
// ─────────────────────────────────────────────────────────────────────────────
export const getAcademicRiskReport = async (req, res, next) => {
  try {
    const {
      departmentId,
      semester,
      academicSessionId,
      attendanceThreshold,
      marksThreshold,
    } = req.query;

    // Resource check for HOD
    if (req.user.role === "hod" && departmentId) {
      const hodProfile = await Faculty.findOne({ userId: req.user._id });
      if (!hodProfile || hodProfile.departmentId.toString() !== departmentId.toString()) {
        throw new ApiError(403, "Access denied. HODs can only view risk reports for their department.");
      }
    }

    const report = await getAcademicRiskDetectionService({
      departmentId,
      semester: semester ? parseInt(semester) : undefined,
      academicSessionId,
      attendanceThreshold: attendanceThreshold ? parseFloat(attendanceThreshold) : 75,
      marksThreshold: marksThreshold ? parseFloat(marksThreshold) : 40,
    });

    res.status(200).json(
      new ApiResponse(200, "Academic risk detection report generated successfully.", report)
    );
  } catch (error) {
    next(error);
  }
};

