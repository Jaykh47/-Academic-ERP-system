import mongoose from "mongoose";

/**
 * STUDENT SCHEMA
 *
 * Stores student-specific profile data.
 * Authentication lives in the User document (linked via userId).
 *
 * Key design decisions:
 * - currentSemester tracks which semester the student is currently in.
 *   This changes each academic year as students progress.
 * - admissionYear is stored (not calculated) because it never changes.
 * - academicSessionId references the session in which the student was admitted.
 * - rollNumber is the college-assigned student roll number (unique per dept).
 * - enrollmentNumber is the university-level unique number.
 */

const studentSchema = new mongoose.Schema(
  {
    // Link to the central User document
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true, // One student profile per user account
    },

    // College roll number (e.g. "BCA001")
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // University enrollment number (e.g. "0801CS231001")
    enrollmentNumber: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
      trim: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    // The academic session in which this student was admitted
    admissionSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "Admission session is required"],
    },

    admissionYear: {
      type: Number,
      required: [true, "Admission year is required"],
      min: [2000, "Admission year seems too early"],
      max: [new Date().getFullYear() + 1, "Admission year cannot be in the future"],
    },

    // Semester is an integer, e.g. 1–6 for a 3-year BCA program
    currentSemester: {
      type: Number,
      required: [true, "Current semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester must not exceed 8"],
    },

    // Optional profile information
    dateOfBirth: {
      type: Date,
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },

    guardianName: {
      type: String,
      trim: true,
      maxlength: [100, "Guardian name must not exceed 100 characters"],
    },

    guardianPhone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Guardian phone must be exactly 10 digits"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [300, "Address must not exceed 300 characters"],
    },

    // Student status: active, detained, graduated, dropped
    status: {
      type: String,
      enum: {
        values: ["active", "detained", "graduated", "dropped"],
        message: "Status must be one of: active, detained, graduated, dropped",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual reference to the User authentication profile
studentSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
// userId, rollNumber, enrollmentNumber already have unique indexes.
studentSchema.index({ departmentId: 1 });
studentSchema.index({ currentSemester: 1 });
studentSchema.index({ departmentId: 1, currentSemester: 1 }); // compound — most common query
studentSchema.index({ status: 1 });

const Student = mongoose.model("Student", studentSchema);
export default Student;

