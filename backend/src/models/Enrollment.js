import mongoose from "mongoose";

/**
 * ENROLLMENT SCHEMA
 *
 * Enrollment is the junction (many-to-many) between Student and Subject,
 * scoped to a specific academic session and semester.
 *
 * Example:
 * Student Ravi (Semester 3, 2024-25) is enrolled in:
 *   - Database Management Systems
 *   - Computer Networks
 *   - Operating Systems
 *
 * Why do we need this?
 * - We can't just look at a student's current semester and auto-derive their
 *   subjects, because students may have backlogs (retaking failed subjects from
 *   previous semesters) or may drop a subject.
 * - Enrollment gives us an explicit, auditable record of "which student is
 *   registered for which subject in which session."
 * - Attendance and Marks are only valid for enrolled students.
 *
 * Key design decisions:
 * - Compound unique index on (studentId, subjectId, academicSessionId) prevents
 *   duplicate enrollments.
 * - status field tracks active/dropped/completed states for each enrollment.
 */

const ENROLLMENT_STATUS = ["active", "dropped", "completed", "backlog"];

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject reference is required"],
    },

    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Academic session is required"],
    },

    // Stored here (even though it's on Subject) so we can query
    // "all enrollments for semester X" directly without a join.
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester must not exceed 8"],
    },

    status: {
      type: String,
      enum: {
        values: ENROLLMENT_STATUS,
        message: `Status must be one of: ${ENROLLMENT_STATUS.join(", ")}`,
      },
      default: "active",
    },

    // Date when enrollment was finalized (can differ from createdAt)
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// PRIMARY CONSTRAINT: A student cannot be enrolled in the same subject
// in the same session twice.
enrollmentSchema.index(
  { studentId: 1, subjectId: 1, academicSessionId: 1 },
  { unique: true }
);

// "Get all subjects a student is enrolled in this session"
enrollmentSchema.index({ studentId: 1, academicSessionId: 1 });

// "Get all students enrolled in this subject this session"
enrollmentSchema.index({ subjectId: 1, academicSessionId: 1 });

enrollmentSchema.index({ status: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;

