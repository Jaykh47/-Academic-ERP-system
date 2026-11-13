import mongoose from "mongoose";

/**
 * NOTIFICATION SCHEMA
 *
 * In-app notifications for students, faculty, HODs and admins.
 *
 * Examples of notifications:
 * - "Your attendance in DBMS has fallen below 75%. You are at risk."
 * - "Internal Test 1 marks for Database Management have been uploaded."
 * - "Student Ravi has attendance below 65% in 3 subjects."
 *
 * Key design decisions:
 * - recipientId references the User document (not Student/Faculty) because
 *   notifications go to users regardless of their role.
 * - type categorizes the notification for frontend filtering.
 * - relatedEntity stores a reference to the document that triggered
 *   this notification (e.g. a Subject, Examination, Student).
 *   We use a flexible { kind, item } structure so one Notification schema
 *   can reference any collection.
 */

const NOTIFICATION_TYPES = [
  "attendance_shortage",    // Student attendance dropped below threshold
  "marks_uploaded",         // Faculty uploaded marks for an exam
  "exam_scheduled",         // New examination created
  "academic_risk",          // Student identified at academic risk
  "general",                // General announcements
];

const notificationSchema = new mongoose.Schema(
  {
    // The user who should receive this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title must not exceed 150 characters"],
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Message must not exceed 1000 characters"],
    },

    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Notification type must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      },
      required: [true, "Notification type is required"],
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Optional: link back to the related document
    relatedEntity: {
      kind: {
        type: String,
        enum: ["Subject", "Examination", "Student", "ClassSession", "AcademicSession"],
      },
      item: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedEntity.kind",
      },
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// "Get all notifications for user X, unread first"
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

notificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

