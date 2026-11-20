import mongoose from "mongoose";

/**
 * ACADEMIC SESSION SCHEMA
 *
 * An academic session represents a full academic year, e.g. "2024-2025".
 *
 * Why is this a separate collection?
 * - Many records (Enrollment, Examination, Marks) reference a session.
 * - Having a dedicated document lets admin manage sessions explicitly
 *   (activate, deactivate, set date ranges).
 * - It prevents typos like "2024-25" vs "2024-2025" from creating duplicate
 *   session keys across the database.
 * - Only ONE session should be active (isCurrent: true) at a time.
 *   The pre-save hook below enforces this.
 *
 * Example document:
 * {
 *   label: "2024-2025",
 *   startDate: "2024-07-01",
 *   endDate: "2025-06-30",
 *   isCurrent: true
 * }
 */
const academicSessionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Academic session label is required"],
      unique: true,
      trim: true,
      set: (val) => (typeof val === "string" ? val.trim().replace(/[\u2013\u2014\u2212]/g, "-") : val),
      // Pattern: YYYY-YYYY (e.g. 2024-2025)
      match: [
        /^\d{4}-\d{4}$/,
        "Session label must follow the format YYYY-YYYY (e.g. 2024-2025)",
      ],
    },

    startDate: {
      type: Date,
      required: [true, "Session start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "Session end date is required"],
    },

    // Only one session should be "current" at any time.
    isCurrent: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // DigiCampus Course Registration Window & Timeline set by Admin
    isEnrollmentOpen: {
      type: Boolean,
      default: false,
    },

    enrollmentStartDate: {
      type: Date,
      default: null,
    },

    enrollmentEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION: endDate must be after startDate
// NOTE: In Mongoose 8+, pre-hooks (even synchronous ones) no longer receive
// a `next` parameter. Simply return to continue or throw to abort.
// ─────────────────────────────────────────────────────────────────────────────
academicSessionSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIQUENESS: Only one session can be "current"
// When saving a new current session, unset isCurrent on all others.
// NOTE: In Mongoose 8+, async pre-hooks do NOT receive a `next` parameter.
// ─────────────────────────────────────────────────────────────────────────────
academicSessionSchema.pre("save", async function () {
  if (this.isModified("isCurrent") && this.isCurrent === true) {
    // Remove isCurrent from all other sessions
    await mongoose.model("AcademicSession").updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
academicSessionSchema.index({ isCurrent: 1 });
academicSessionSchema.index({ isActive: 1 });

const AcademicSession = mongoose.model("AcademicSession", academicSessionSchema);
export default AcademicSession;
