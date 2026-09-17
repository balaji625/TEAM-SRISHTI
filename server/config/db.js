/**
 * Database connection — Mongoose + MongoDB
 * Reads MONGODB_URI exclusively from environment variables.
 * Never hardcode credentials here.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not defined in environment variables.');
    logger.error('Create a .env file based on .env.example and set MONGODB_URI.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // mongoose 8.x uses these by default, listed for clarity
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
};

module.exports = { connectDB, disconnectDB };
