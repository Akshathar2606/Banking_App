// ===========================================
// BankEase - Database Connection Test
// src/tests/testConnection.js
//
// Run this with: npm run db:test
// ===========================================

const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function runTest() {
  console.log('------------------------------------------');
  console.log('  BankEase - MongoDB Connection Test');
  console.log('------------------------------------------');
  console.log('Attempting to connect to MongoDB Atlas...\n');

  try {
    await connectDB();

    // If we reach here, the connection was successful
    console.log('MongoDB connected successfully');
    console.log('Host:', mongoose.connection.host);
    console.log('Database name:', mongoose.connection.name);

  } catch (error) {
    // Print the error message but NOT the connection string or credentials
    console.error('\nConnection failed.');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Your .env file exists and contains MONGODB_URI');
    console.error('  2. The connection string is correct (no placeholder text)');
    console.error('  3. Your IP address is whitelisted in MongoDB Atlas');
    console.error('  4. Your Atlas username and password are correct');

    // Exit with a non-zero code so scripts/CI can detect failure
    process.exit(1);

  } finally {
    // Always close the connection cleanly after the test
    await mongoose.connection.close();
    console.log('\nConnection closed. Test complete.');
    console.log('------------------------------------------');
  }
}

runTest();
