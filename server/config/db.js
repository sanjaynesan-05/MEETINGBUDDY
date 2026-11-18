const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Re-queue meetings a previous process left half-processed.
    require('../services/processing/jobQueue').recoverStuckMeetings()
      .catch((err) => console.error('[JobQueue] Recovery failed:', err.message));
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
