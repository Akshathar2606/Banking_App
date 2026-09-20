// ===========================================
// BankEase - User Model
// src/models/User.js
// ===========================================
// Represents a registered user of the BankEase app.
// Passwords are NEVER stored as plain text — only the hashed version is saved.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Email must be unique across all users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // Phone number — used for display and demo purposes
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    // Hashed password only — plain text passwords are NEVER stored here
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },

    // Optional URL or file path to the user's profile picture
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,

    // Maps to the 'users' collection in MongoDB
    collection: 'users',
  }
);

// Note: email index is already created automatically by unique: true above.
// A separate schema.index({ email: 1 }) would duplicate it, so it is omitted.

// Index on phone for fast phone-based lookups
userSchema.index({ phone: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
