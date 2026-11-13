import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI defined in environment variables.
 *
 * Key design decisions:
 * - We export a function (not auto-connect on import) so server.js controls
 *   the startup sequence: DB first, then HTTP server.
 * - On connection failure we log and exit the process — there is no point
 *   serving requests without a database.
 * - Mongoose emits events we can listen to for reconnect logging.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Log when mongoose loses the connection (e.g. network blip)
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    // Log successful reconnections
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected.");
    });
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Exit with failure code — the process manager (e.g. PM2) will restart
    process.exit(1);
  }
};

export default connectDB;

