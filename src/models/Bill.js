// ===========================================
// BankEase - Bill Model
// src/models/Bill.js
// ===========================================
// Tracks utility and service bills that a user needs to pay.
// Supports electricity, water, internet, mobile, and other bill types.

const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    // The user who owns this bill
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Name of the company or service provider (e.g. "BESCOM", "Airtel")
    billerName: {
      type: String,
      required: [true, 'Biller name is required'],
      trim: true,
    },

    // Category of the bill
    billType: {
      type: String,
      required: [true, 'Bill type is required'],
      enum: {
        values: ['electricity', 'water', 'internet', 'mobile', 'other'],
        message: 'Bill type must be electricity, water, internet, mobile, or other',
      },
    },

    // Consumer/account number assigned by the service provider
    consumerNumber: {
      type: String,
      required: [true, 'Consumer number is required'],
      trim: true,
    },

    // Amount due for this bill
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be 0 or greater'],
    },

    // Date by which the bill must be paid
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },

    // Current payment status of the bill
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'paid', 'overdue'],
        message: 'Status must be pending, paid, or overdue',
      },
      default: 'pending',
    },

    // Timestamp of when the bill was actually paid (null if not yet paid)
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt field
    timestamps: { createdAt: true, updatedAt: false },

    // Maps to the 'bills' collection in MongoDB
    collection: 'bills',
  }
);

// Index on userId to quickly list all bills for a user
billSchema.index({ userId: 1 });

// Index on userId + status: fetch only pending or overdue bills for a user
billSchema.index({ userId: 1, status: 1 });

// Index on dueDate: useful for finding bills that are coming due soon
billSchema.index({ dueDate: 1 });

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
