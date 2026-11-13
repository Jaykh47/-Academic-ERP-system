import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * USER SCHEMA
 *
 * This is the central authentication document.
 * Every person in the system — Admin, HOD, Faculty, Student — has exactly
 * one User document regardless of their role.
 *
 * Role-specific profile data (e.g. department, employeeId) is stored
 * in separate Student or Faculty documents and linked via userId.
 *
 * Why this approach?
 * - Authentication logic (login, tokens, password) stays in one place.
 * - Adding a new role only requires a new profile collection, not a new auth system.
 * - Avoids duplicating auth logic across multiple user types.
 */

const ROLES = {
  ADMIN: "admin",
  HOD: "hod",
  FACULTY: "faculty",
  STUDENT: "student",
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,     // enforced at DB level
      lowercase: true,  // normalize before saving
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // select: false means this field will NOT be included in query
      // results by default. You must explicitly request it with .select("+password")
      // when you need it (e.g. during login). This prevents accidentally
      // leaking password hashes in API responses.
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: "Role must be one of: admin, hod, faculty, student",
      },
      required: [true, "Role is required"],
    },

    // Soft delete / account control
    // Instead of deleting a user (which would break references in Attendance,
    // Marks etc.), we deactivate them. isActive: false blocks login.
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Refresh Token Storage ─────────────────────────────────────────────
    // We store a hashed version of the refresh token in the DB.
    // On logout, we clear this field — this is how we "revoke" a token.
    // The raw token is sent to the client as an HTTP-only cookie.
    // We store it hashed so that even if the DB is compromised,
    // an attacker cannot use the leaked refresh token.
    refreshToken: {
      type: String,
      select: false, // never return this in API responses
    },

    // ── Password Reset ─────────────────────────────────────────────────────
    // These fields support the "forgot password" flow:
    // 1. User requests reset → we generate a token and store its hash here.
    // 2. We email the raw token to the user.
    // 3. User submits the raw token → we hash it and compare with DB.
    // 4. If match and not expired → allow password change, then clear these.
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Track when password was last changed.
    // Used to invalidate tokens issued before the last password change.
    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
// email already has a unique index from `unique: true` in the field definition.
// Add index on role for queries like "find all faculty" or "find all students"
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SAVE MIDDLEWARE: Hash password before saving
// ─────────────────────────────────────────────────────────────────────────────
// This runs automatically whenever a User document is saved.
// We ONLY re-hash if the password field was actually modified.
// Without this check, every time you update a user's name or email,
// the password would get double-hashed and become invalid.
//
// NOTE: In Mongoose 8+, async pre-hooks do NOT receive a `next` parameter.
// You simply return (to continue) or throw an error (to abort).
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Cost factor of 12 is a good balance of security and performance.
  // Higher = slower to brute-force but also slower to process.
  this.password = await bcrypt.hash(this.password, 12);

  // If the password was changed (not on initial creation), record the timestamp
  if (!this.isNew) {
    // Subtract 1 second to account for token issuance timing edge cases
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * comparePassword — Verifies a plain-text password against the stored hash.
 * Used during login.
 *
 * We use an instance method (not a static) because it operates on
 * a specific user document.
 *
 * @param {string} candidatePassword - The plain-text password from the login request
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * hasPasswordChangedAfter — Checks if the password was changed AFTER a JWT was issued.
 * Used to invalidate old tokens after a password change.
 *
 * @param {number} jwtIssuedAt - The `iat` claim from the JWT (Unix timestamp in seconds)
 * @returns {boolean} true if password changed after the token was issued
 */
userSchema.methods.hasPasswordChangedAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    // Convert passwordChangedAt to seconds (JWT iat is in seconds)
    const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return changedAtSeconds > jwtIssuedAt;
  }
  // Password was never changed
  return false;
};

// Export the role constants so they can be reused across the codebase
export { ROLES };

const User = mongoose.model("User", userSchema);
export default User;

