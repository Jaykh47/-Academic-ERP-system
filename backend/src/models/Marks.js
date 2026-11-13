import mongoose from "mongoose";

/**
 * MARKS SCHEMA
 *
 * Records one student's obtained marks in one examination.
 *
 * Example:
 * Student Ravi scored 18 out of 25 in DBMS Internal Test 1.
 *
 * Key design decisions:
 *
 * 1. ONE DOCUMENT PER STUDENT PER EXAMINATION.
 *    The compound unique index on (studentId, examinationId) prevents
 *    duplicate mark entries — equivalent to the attendance constraint.
 *
 * 2. subjectId IS STORED REDUNDANTLY (like Attendance).
 *    This allows "get all marks for student X in subject Y" without
 *    joining through Examination every time.
 *
 * 3. GRADE IS CALCULATED, NOT STORED.
 *    The grade is not stored here because it depends on the grading
 *    configuration, which may change. Grades are computed in the
 *    service layer when needed.
 *    EXCEPTION: If the college uses a fixed grading table that never changes,
 *    we could store the grade here as a cache. We'll handle this in Phase 8.
 *
 * 4. isAbsent FLAG.
 *    If a student was absent for an exam, we still create a Marks document
 *    with isAbsent: true and obtainedMarks: 0. This avoids null-checks
 *    everywhere and keeps "total students who appeared" calculations simple.
 *
 * 5. EDIT TRACKING.
 *    Marks are sensitive records. We track who entered and last modified them.
 */

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Examination",
      required: [true, "Examination reference is required"],
    },

    // Redundant but intentional — avoids joining through Examination
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject reference is required"],
    },

    // Also redundant — stored for direct session-wise queries
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Academic session is required"],
    },

    obtainedMarks: {
      type: Number,
      required: [true, "Obtained marks are required"],
      min: [0, "Obtained marks cannot be negative"],
      // Max validation happens in the service layer against Examination.maximumMarks
    },

    // Was the student absent for this examination?
    isAbsent: {
      type: Boolean,
      default: false,
    },

    // Optional remarks (e.g. "Malpractice", "Medical exemption applied")
    remarks: {
      type: String,
      trim: true,
      maxlength: [300, "Remarks must not exceed 300 characters"],
    },

    // Who entered the marks originally
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Faculty who entered marks is required"],
    },

    // Who last modified the marks (may be different from enteredBy)
    lastModifiedBy: {
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

// PRIMARY CONSTRAINT: One marks record per student per examination.
marksSchema.index(
  { studentId: 1, examinationId: 1 },
  {
    unique: true,
    name: "unique_student_examination_marks",
  }
);

// "Get all marks for student X in subject Y" (student performance view)
marksSchema.index({ studentId: 1, subjectId: 1 });

// "Get all marks entries for examination X" (result sheet view for faculty)
marksSchema.index({ examinationId: 1 });

// "Get all marks for student X in this academic session" (semester result)
marksSchema.index({ studentId: 1, academicSessionId: 1 });

// "Get all marks for subject X in this session" (subject analytics)
marksSchema.index({ subjectId: 1, academicSessionId: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION: obtainedMarks must not exceed the exam's maximumMarks
// This is validated in the service layer where we have access to the
// Examination document. We cannot do it here because Mongoose validators
// cannot reference other documents without an async lookup.
// ─────────────────────────────────────────────────────────────────────────────

const Marks = mongoose.model("Marks", marksSchema);
export default Marks;

