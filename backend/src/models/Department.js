import mongoose from "mongoose";

/**
 * DEPARTMENT SCHEMA
 *
 * Represents an academic department within the college (e.g. BCA, BBA, BSc IT).
 *
 * Key design decisions:
 * - HOD is a reference to a Faculty document (not User) because
 *   HOD-specific business logic (department restriction, analytics access)
 *   works with Faculty profile data.
 * - departmentCode is unique (e.g. "BCA", "BBA") — used as a human-readable
 *   identifier in reports and displays.
 * - We track isActive so a department can be deactivated without deleting
 *   its historical data (students, marks, attendance records).
 */
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Department name must not exceed 100 characters"],
    },

    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true, // e.g. "bca" → "BCA"
      trim: true,
      maxlength: [10, "Department code must not exceed 10 characters"],
      match: [
        /^[A-Z0-9]+$/,
        "Department code must contain only uppercase letters and numbers",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must not exceed 500 characters"],
    },

    // HOD is optional at creation (department can exist before HOD is assigned)
    // References the Faculty document (not User) for HOD-specific data
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
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
// code and name already have unique indexes from their field definitions.
departmentSchema.index({ isActive: 1 });

const Department = mongoose.model("Department", departmentSchema);
export default Department;

