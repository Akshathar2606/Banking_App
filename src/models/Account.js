// ===========================================
// BankEase - Account Model
// src/models/Account.js
// ===========================================
// Represents a bank account belonging to a user.
// Account numbers and balances are simulated demo data only.

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    // Reference to the User who owns this account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Simulated account number — must be unique across all accounts
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
      trim: true,
    },

    // Type of bank account
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['savings', 'current'],
        message: 'Account type must be either "savings" or "current"',
      },
    },

    // Current balance — starts at 0 by default (demo data)
    balance: {
      type: Number,
      required: [true, 'Balance is required'],
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },

    // Currency code — defaulting to Indian Rupee for this demo
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,

    // Maps to the 'accounts' collection in MongoDB
    collection: 'accounts',
  }
);

// Index on userId to quickly fetch all accounts for a user
accountSchema.index({ userId: 1 });

// Note: accountNumber index is already created automatically by unique: true above.
// A separate schema.index({ accountNumber: 1 }) would duplicate it, so it is omitted.

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
