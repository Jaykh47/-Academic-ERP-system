/**
 * Seed Script — Create a test Admin user
 *
 * Run once to create an admin account for testing.
 * Run with: node src/scripts/seedAdmin.js
 *
 * This script is for DEVELOPMENT ONLY.
 * Production users are created through the admin panel.
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existing = await User.findOne({ email: "admin@college.com" });
    if (existing) {
      console.log("⚠️  Admin user already exists. Skipping creation.");
      console.log(`   Email: admin@college.com`);
      console.log(`   Role:  ${existing.role}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = await User.create({
      name: "System Administrator",
      email: "admin@college.com",
      password: "Admin@1234",
      role: "admin",
    });

    console.log("✅ Admin user created successfully:");
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: admin@college.com`);
    console.log(`   Pass:  Admin@1234`);
    console.log(`   Role:  ${admin.role}`);
    console.log("\n⚠️  Change this password immediately after first login!");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();

