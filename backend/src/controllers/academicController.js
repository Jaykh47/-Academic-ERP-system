import { Subject, Student } from "../models/index.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";
import {
  createSubjectService,
  assignFacultyToSubjectService,
  enrollStudentService,
  batchEnrollSemesterService,
  getEnrolledStudentsForSubjectService,
  getEnrolledSubjectsForStudentService,
} from "../services/academicService.js";

/**
 * ACADEMIC CONTROLLER
 *
 * Exposes endpoints for managing courses, course instructors,
 * and academic enrollment.
 */

// ── SUBJECTS ─────────────────────────────────────────────────────────────────

export const createSubject = async (req, res, next) => {
  try {
    const subject = await createSubjectService(req.body);
    res.status(201).json(new ApiResponse(201, "Subject created successfully.", { subject }));
  } catch (error) {
    next(error);
  }
};

export const getAllSubjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { departmentId, semester, search, subjectType } = req.query;

    const filter = { isActive: true };
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = parseInt(semester);
    if (subjectType) filter.subjectType = subjectType;
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .populate("departmentId", "name code")
        .populate({
          path: "assignedFaculty",
          select: "employeeId designation userId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ semester: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Subject.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Subjects fetched successfully.", {
        subjects,
        pagination: buildPaginationMeta(page, limit, total),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId)
      .populate("departmentId", "name code")
      .populate({
        path: "assignedFaculty",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      });

    if (!subject) throw new ApiError(404, "Subject not found.");

    res.status(200).json(new ApiResponse(200, "Subject fetched successfully.", { subject }));
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const allowed = ["name", "credits", "subjectType", "description", "isActive"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const subject = await Subject.findByIdAndUpdate(subjectId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("departmentId", "name code")
      .populate({
        path: "assignedFaculty",
        select: "employeeId designation userId",
        populate: { path: "userId", select: "name email" },
      });

    if (!subject) throw new ApiError(404, "Subject not found.");

    res.status(200).json(new ApiResponse(200, "Subject updated successfully.", { subject }));
  } catch (error) {
    next(error);
  }
};

export const assignFaculty = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { facultyId } = req.body;

    const subject = await assignFacultyToSubjectService(subjectId, facultyId, req.user);

    res.status(200).json(
      new ApiResponse(200, "Faculty assigned to subject successfully.", { subject })
    );
  } catch (error) {
    next(error);
  }
};

// ── ENROLLMENT ───────────────────────────────────────────────────────────────

export const enrollSingleStudent = async (req, res, next) => {
  try {
    const enrollment = await enrollStudentService(req.body);
    res.status(201).json(new ApiResponse(201, "Student enrolled successfully.", { enrollment }));
  } catch (error) {
    next(error);
  }
};

export const batchEnrollSemester = async (req, res, next) => {
  try {
    const result = await batchEnrollSemesterService(req.body);
    res.status(200).json(new ApiResponse(200, "Batch enrollment completed successfully.", result));
  } catch (error) {
    next(error);
  }
};

export const getEnrolledStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicSessionId } = req.query;

    const enrollments = await getEnrolledStudentsForSubjectService(subjectId, academicSessionId);

    res.status(200).json(
      new ApiResponse(200, "Enrolled students fetched successfully.", {
        total: enrollments.length,
        enrollments,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMyEnrolledSubjects = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student profile not found.");

    const { academicSessionId } = req.query;
    const enrollments = await getEnrolledSubjectsForStudentService(student._id, academicSessionId);

    res.status(200).json(
      new ApiResponse(200, "Enrolled subjects fetched successfully.", {
        total: enrollments.length,
        enrollments,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getStudentEnrolledSubjects = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicSessionId } = req.query;

    const enrollments = await getEnrolledSubjectsForStudentService(studentId, academicSessionId);

    res.status(200).json(
      new ApiResponse(200, "Student's enrolled subjects fetched successfully.", {
        total: enrollments.length,
        enrollments,
      })
    );
  } catch (error) {
    next(error);
  }
};

