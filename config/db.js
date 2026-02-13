const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both MONGODB_URI and MONGO_URI for flexibility
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found in environment variables. Please set MONGODB_URI or MONGO_URI.');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
