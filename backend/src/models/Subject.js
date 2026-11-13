import mongoose from "mongoose";

/**
 * SUBJECT SCHEMA
 *
 * A subject is a course taught in a specific department and semester.
 * Example: "Database Management Systems" taught in BCA Semester 3.
 *
 * Key design decisions:
 * - subjectCode must be unique within a department+semester combination.
 *   The same subject code could theoretically exist in a different dept,
 *   so we enforce uniqueness as a compound index, not a field-level unique.
 * - subjectType differentiates theory, practical, and project subjects
 *   (they may have different attendance and marks policies).
 * - assignedFaculty references the Faculty document of whoever currently
 *   teaches this subject.
 * - credits is important for GPA calculation in future phases.
 * - totalClasses is not stored here — it is calculated from ClassSession records.
 */

const SUBJECT_TYPES = ["theory", "practical", "project", "seminar"];

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: [150, "Subject name must not exceed 150 characters"],
    },

    code: {
      type: String,
      required: [true, "Subject code is required"],
      uppercase: true,
      trim: true,
      maxlength: [20, "Subject code must not exceed 20 characters"],
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester must not exceed 8"],
    },

    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [6, "Credits must not exceed 6"],
    },

    subjectType: {
      type: String,
      required: [true, "Subject type is required"],
      enum: {
        values: SUBJECT_TYPES,
        message: `Subject type must be one of: ${SUBJECT_TYPES.join(", ")}`,
      },
      default: "theory",
    },

    // The faculty member currently assigned to teach this subject
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must not exceed 500 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// A subject code must be unique within a department.
// (Two departments could theoretically reuse the same code — unlikely but allowed.)
subjectSchema.index({ code: 1, departmentId: 1 }, { unique: true });

// Most common query pattern: "fetch all subjects for Dept X, Semester Y"
subjectSchema.index({ departmentId: 1, semester: 1 });

subjectSchema.index({ assignedFaculty: 1 }); // "which subjects does this faculty teach?"
subjectSchema.index({ isActive: 1 });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;

