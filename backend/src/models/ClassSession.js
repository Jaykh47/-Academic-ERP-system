import mongoose from "mongoose";

/**
 * CLASS SESSION SCHEMA
 *
 * A ClassSession represents a single physical class/lecture/lab held on
 * a specific date and time for a specific subject.
 *
 * Example:
 * "Database Management Systems lecture on 2024-09-15, 10:00–11:00 AM,
 *  conducted by Faculty Meena, in Room 301"
 *
 * Why is this a separate collection?
 * - Attendance records (Attendance schema) reference a ClassSession.
 *   Without this, we'd have to duplicate date/time/faculty in every
 *   attendance record.
 * - ClassSession is the "denominator" in the attendance percentage formula:
 *   Attendance % = (Present records for student) / (Total ClassSessions for subject) × 100
 * - Faculty submits attendance AFTER a ClassSession is created (or simultaneously).
 * - Admin/HOD can audit which classes were actually conducted.
 *
 * Status flow:
 *   scheduled → ongoing → completed
 *                       ↘ cancelled
 */

const CLASS_SESSION_STATUS = ["scheduled", "ongoing", "completed", "cancelled"];
const SESSION_TYPES = ["lecture", "practical", "tutorial", "extra"];

const classSessionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: [true, "Faculty is required"],
    },

    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Academic session is required"],
    },

    // ISO Date (without time) — the date the class was held
    date: {
      type: Date,
      required: [true, "Class date is required"],
    },

    // Store time as strings (HH:MM format) for simplicity
    // Using strings avoids timezone complexity for display purposes
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"],
    },

    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"],
    },

    sessionType: {
      type: String,
      enum: {
        values: SESSION_TYPES,
        message: `Session type must be one of: ${SESSION_TYPES.join(", ")}`,
      },
      default: "lecture",
    },

    topic: {
      type: String,
      trim: true,
      maxlength: [300, "Topic must not exceed 300 characters"],
    },

    room: {
      type: String,
      trim: true,
      maxlength: [50, "Room identifier must not exceed 50 characters"],
    },

    status: {
      type: String,
      enum: {
        values: CLASS_SESSION_STATUS,
        message: `Status must be one of: ${CLASS_SESSION_STATUS.join(", ")}`,
      },
      default: "scheduled",
    },

    // Notes from faculty (e.g. reason for cancellation)
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, "Remarks must not exceed 500 characters"],
    },

    // Once attendance is submitted, we lock the session to prevent editing
    isAttendanceSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// Most common query: "Get all class sessions for subject X in session Y"
// (used to calculate total conducted classes → denominator for attendance %)
classSessionSchema.index({ subjectId: 1, academicSessionId: 1 });

// "Get all classes conducted by faculty X"
classSessionSchema.index({ facultyId: 1, academicSessionId: 1 });

// Date-range queries for daily/monthly reports
classSessionSchema.index({ date: 1 });

// Combined index for the most critical lookup (subject + date range)
classSessionSchema.index({ subjectId: 1, date: 1 });

const ClassSession = mongoose.model("ClassSession", classSessionSchema);
export default ClassSession;

