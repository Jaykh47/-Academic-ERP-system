/**
 * Schema Validation Script — Phase 2 Testing
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Imports all models (which registers schemas and triggers index creation)
 * 3. Verifies that all models are registered correctly
 * 4. Reports success or errors
 *
 * Run with: node src/scripts/validateSchemas.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

// Import all models
import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import AcademicSession from "../models/AcademicSession.js";
import Subject from "../models/Subject.js";
import Enrollment from "../models/Enrollment.js";
import ClassSession from "../models/ClassSession.js";
import Attendance from "../models/Attendance.js";
import Examination from "../models/Examination.js";
import Marks from "../models/Marks.js";
import Notification from "../models/Notification.js";

const models = {
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

const validateSchemas = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();

    console.log("\n📋 Registered Mongoose Models:\n");

    for (const [name, model] of Object.entries(models)) {
      const collectionName = model.collection.name;
      const pathCount = Object.keys(model.schema.paths).length;
      const indexCount = model.schema.indexes().length;
      console.log(
        `  ✅ ${name.padEnd(20)} → collection: "${collectionName.padEnd(20)}" | paths: ${pathCount} | indexes: ${indexCount}`
      );
    }

    // Wait for indexes to be created in MongoDB
    console.log("\n🔄 Syncing indexes to MongoDB...");
    await Promise.all(
      Object.values(models).map((model) => model.createIndexes())
    );
    console.log("✅ All indexes synced successfully.\n");

    // Final summary
    const modelNames = mongoose.modelNames();
    console.log(`\n📊 Total models registered: ${modelNames.length}`);
    console.log("─".repeat(50));
    console.log("✅ Phase 2 schema validation PASSED. All models are healthy.");
    console.log("─".repeat(50));

  } catch (error) {
    console.error("\n❌ Schema validation FAILED:");
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed.");
    process.exit(0);
  }
};

validateSchemas();

