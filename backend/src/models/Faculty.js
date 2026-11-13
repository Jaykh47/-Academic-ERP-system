import mongoose from "mongoose";

/**
 * FACULTY SCHEMA
 *
 * Stores faculty-specific profile information.
 * Authentication data lives in the User document (linked via userId).
 *
 * Key design decisions:
 * - userId links to the User document (the auth record).
 * - employeeId is a college-issued identifier (e.g. "FAC001").
 * - departmentId links to the Department the faculty belongs to.
 * - subjects is an array of Subject ObjectIds — subjects assigned to this faculty.
 *   We store this here (instead of only on Subject) so we can quickly answer:
 *   "What subjects does this faculty member teach?" without an aggregation.
 * - designation captures academic rank (e.g. "Assistant Professor").
 */

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Lab Instructor",
  "Guest Faculty",
];

const facultySchema = new mongoose.Schema(
  {
    // Link to the central User document
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true, // One faculty profile per user account
    },

    // College-issued employee ID
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9-]+$/,
        "Employee ID must contain only uppercase letters, numbers, and hyphens",
      ],
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      enum: {
        values: DESIGNATIONS,
        message: `Designation must be one of: ${DESIGNATIONS.join(", ")}`,
      },
    },

    // Subjects this faculty is currently assigned to teach.
    // Populated/updated whenever admin assigns subjects.
    // We keep this as a convenience array — the Subject document also
    // stores assignedFaculty for the reverse lookup.
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    // Optional contact and profile info
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },

    qualification: {
      type: String,
      trim: true,
      maxlength: [200, "Qualification must not exceed 200 characters"],
    },

    joiningDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
// userId and employeeId already have unique indexes.
facultySchema.index({ departmentId: 1 });

const Faculty = mongoose.model("Faculty", facultySchema);
export default Faculty;

