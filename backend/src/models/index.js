/**
 * MODELS INDEX
 *
 * Central export and registration for all Mongoose models.
 * Importing this file guarantees all schemas are registered with Mongoose,
 * preventing MissingSchemaError during dynamic .populate() calls across the app.
 */

import User from "./User.js";
import Student from "./Student.js";
import Faculty from "./Faculty.js";
import Department from "./Department.js";
import AcademicSession from "./AcademicSession.js";
import Subject from "./Subject.js";
import Enrollment from "./Enrollment.js";
import ClassSession from "./ClassSession.js";
import Attendance from "./Attendance.js";
import Examination from "./Examination.js";
import Marks from "./Marks.js";
import Notification from "./Notification.js";

export {
  User,
  Student,
  Faculty,
  Department,
  AcademicSession,
  Subject,
  Enrollment,
  ClassSession,
  Attendance,
  Examination,
  Marks,
  Notification,
};

