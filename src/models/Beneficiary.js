// ===========================================
// BankEase - Beneficiary Model
// src/models/Beneficiary.js
// ===========================================
// Stores saved recipients that a user can transfer money to.
// All banking details here are simulated demo data only.

const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    // The user who saved this beneficiary
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Full name of the beneficiary
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
    },

    // Simulated account number of the beneficiary
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },

    // Name of the beneficiary's bank (demo/simulated)
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },

    // IFSC code identifies the bank branch in India (demo data)
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
      trim: true,
    },

    // Optional short name the user gives this beneficiary (e.g. "Mom", "Landlord")
    nickname: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    // Automatically adds createdAt field (no updatedAt needed for beneficiaries)
    timestamps: { createdAt: true, updatedAt: false },

    // Maps to the 'beneficiaries' collection in MongoDB
    collection: 'beneficiaries',
  }
);

// Index on userId to quickly list all beneficiaries for a user
beneficiarySchema.index({ userId: 1 });

// Compound index: prevent the same user from adding the same account twice
beneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

module.exports = Beneficiary;
