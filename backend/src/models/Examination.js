import mongoose from "mongoose";

/**
 * EXAMINATION SCHEMA
 *
 * An Examination is an assessment event — Internal Test 1, Assignment,
 * Practical Exam, Semester Exam, etc.
 *
 * Example:
 * "Internal Test 1 for Database Management Systems,
 *  Semester 3, 2024-25, Max Marks: 25, Date: 2024-09-20"
 *
 * Key design decisions:
 * - Each Examination belongs to a specific subject and academic session.
 * - examType determines how marks factor into the overall grade.
 *   This is flexible — the service layer applies calculation rules.
 * - maximumMarks is stored here to validate marks entries
 *   (Marks.obtainedMarks must not exceed this value).
 * - passMarks is stored here to determine pass/fail status.
 * - weightage (percentage) allows different exam types to contribute
 *   different proportions to the final grade (configurable, not hardcoded).
 * - createdBy tracks which faculty created the examination.
 */

const EXAM_TYPES = [
  "internal_test",    // e.g. Internal Test 1, 2
  "assignment",       // Written assignments
  "practical",        // Lab practical exams
  "project",          // Project evaluations
  "semester",         // End-of-semester exam
  "quiz",             // Short class quizzes
  "viva",             // Oral examinations
];

const examinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Examination name is required"],
      trim: true,
      maxlength: [150, "Examination name must not exceed 150 characters"],
    },

    examType: {
      type: String,
      required: [true, "Exam type is required"],
      enum: {
        values: EXAM_TYPES,
        message: `Exam type must be one of: ${EXAM_TYPES.join(", ")}`,
      },
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },

    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Academic session is required"],
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester must not exceed 8"],
    },

    maximumMarks: {
      type: Number,
      required: [true, "Maximum marks are required"],
      min: [1, "Maximum marks must be at least 1"],
      max: [200, "Maximum marks seem unreasonably high"],
    },

    passMarks: {
      type: Number,
      required: [true, "Pass marks are required"],
      min: [0, "Pass marks cannot be negative"],
      validate: {
        validator: function (val) {
          return val <= this.maximumMarks;
        },
        message: "Pass marks cannot exceed maximum marks",
      },
    },

    // Contribution of this exam to the overall subject grade (0–100%)
    // The service layer ensures all exam weightages for a subject sum to 100
    weightage: {
      type: Number,
      min: [0, "Weightage cannot be negative"],
      max: [100, "Weightage cannot exceed 100"],
      default: 0,
    },

    examDate: {
      type: Date,
    },

    // The faculty who created this examination record
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Creator reference is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must not exceed 500 characters"],
    },

    // Marks freezing & audit lock
    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// "Get all examinations for subject X in session Y"
examinationSchema.index({ subjectId: 1, academicSessionId: 1 });

// "Get all examinations for semester X in session Y" (semester-wise overview)
examinationSchema.index({ semester: 1, academicSessionId: 1 });

examinationSchema.index({ examType: 1 });
examinationSchema.index({ createdBy: 1 });
examinationSchema.index({ examDate: 1 });

const Examination = mongoose.model("Examination", examinationSchema);
export default Examination;

