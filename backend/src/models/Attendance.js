import mongoose from "mongoose";

/**
 * ATTENDANCE SCHEMA
 *
 * Records one student's attendance status for one class session.
 * This is the most frequently written and queried collection in the system.
 *
 * Example:
 * Student Ravi attended the DBMS lecture on 2024-09-15 → status: "present"
 * Student Priya missed the same lecture → status: "absent"
 *
 * Key design decisions:
 *
 * 1. ONE DOCUMENT PER STUDENT PER CLASS SESSION.
 *    The compound unique index on (studentId, classSessionId) prevents
 *    duplicate attendance records. This is a critical data integrity constraint.
 *
 * 2. WE STORE subjectId AND facultyId REDUNDANTLY.
 *    Even though ClassSession already has these references, storing them
 *    directly on Attendance allows fast queries like:
 *    "Show me all attendance for student X in subject Y"
 *    without an expensive join through ClassSession.
 *    This is a deliberate denormalization for read performance.
 *
 * 3. LATE ARRIVAL POLICY.
 *    "late" attendance is stored separately and treated as either present
 *    or absent depending on college policy (configurable in business logic).
 *    We store the raw status and let the service layer apply the policy.
 *
 * 4. ATTENDANCE PERCENTAGE IS NEVER STORED.
 *    It is always calculated on-the-fly from these individual records.
 *    Storing percentages would create a stale data problem: every time
 *    a class session is added or attendance is corrected, you'd have to
 *    update percentages everywhere.
 */

const ATTENDANCE_STATUS = ["present", "absent", "late"];

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    classSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: [true, "Class session reference is required"],
    },

    // Redundant but intentional — avoids joining through ClassSession
    // for the most common attendance queries
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject reference is required"],
    },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Faculty reference is required"],
    },

    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Academic session reference is required"],
    },

    // The date is also redundant (it's on ClassSession) but stored here
    // so attendance queries can filter by date range without joining
    date: {
      type: Date,
      required: [true, "Attendance date is required"],
    },

    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUS,
        message: `Attendance status must be one of: ${ATTENDANCE_STATUS.join(", ")}`,
      },
      required: [true, "Attendance status is required"],
    },

    // Faculty can leave a remark (e.g. "Student left early", "Medical leave")
    remarks: {
      type: String,
      trim: true,
      maxlength: [300, "Remarks must not exceed 300 characters"],
    },

    // Track if this record was manually corrected after initial submission
    // Important for audit purposes
    isCorrected: {
      type: Boolean,
      default: false,
    },

    // If corrected, who corrected it and when?
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    correctedAt: {
      type: Date,
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

// PRIMARY CONSTRAINT: One attendance record per student per class session.
// This is the most important constraint in the entire system.
attendanceSchema.index(
  { studentId: 1, classSessionId: 1 },
  {
    unique: true,
    name: "unique_student_session_attendance",
  }
);

// "Get attendance % for student X in subject Y" (most common query)
attendanceSchema.index({ studentId: 1, subjectId: 1 });

// "Get all attendance for a subject in a session" (for faculty/HOD view)
attendanceSchema.index({ subjectId: 1, academicSessionId: 1 });

// "Get all attendance records for a class session" (for session summary)
attendanceSchema.index({ classSessionId: 1 });

// Date-range queries for monthly reports
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ subjectId: 1, date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;

