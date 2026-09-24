const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    // Hashed password only — plain text passwords are NEVER stored here
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,         // auto-manages createdAt and updatedAt
    collection: 'users',      // explicit MongoDB collection name
  }
);

// Note: phone index is already created automatically by unique: true above.
// A separate schema.index({ phone: 1 }) would duplicate it, so it is omitted.

module.exports = mongoose.model('User', userSchema);
