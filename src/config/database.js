// ===========================================
// BankEase - Database Connection Module
// src/config/database.js
// ===========================================

// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI stored in the .env file.
 * Call this function wherever you need to establish a database connection.
 *
 * @returns {Promise<void>}
 */
async function connectDB() {
  // Read the connection URI from environment variables (never hardcoded)
  const uri = process.env.MONGODB_URI;

  // Safety check: make sure the URI is actually set in .env
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Please add it to your .env file.'
    );
  }

  // Prevent accidental use of the placeholder value
  if (uri === '<MY_MONGODB_CONNECTION_STRING>' || uri === 'your_mongodb_connection_string_here') {
    throw new Error(
      'MONGODB_URI still contains a placeholder. Please replace it with your real MongoDB Atlas connection string in .env.'
    );
  }

  // Attempt the connection
  await mongoose.connect(uri);
}

module.exports = connectDB;
