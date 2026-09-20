// ===========================================
// BankEase - Transaction Model
// src/models/Transaction.js
// ===========================================
// Records every financial event on an account:
// credits, debits, transfers, and bill payments.

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // The user who initiated or owns this transaction
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // The account this transaction belongs to
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
    },

    // Direction and nature of the transaction
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['credit', 'debit', 'transfer', 'bill_payment'],
        message: 'Type must be credit, debit, transfer, or bill_payment',
      },
    },

    // Transaction amount — must be a positive number
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be 0 or greater'],
    },

    // Human-readable description of what the transaction was for
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    // Name of the recipient (used for transfers and payments)
    recipientName: {
      type: String,
      default: null,
      trim: true,
    },

    // Unique reference number for this transaction (like a receipt ID)
    referenceNumber: {
      type: String,
      required: [true, 'Reference number is required'],
      unique: true,
      trim: true,
    },

    // Current state of the transaction
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'completed', 'failed'],
        message: 'Status must be pending, completed, or failed',
      },
      default: 'completed',
    },

    // When the transaction occurred
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Maps to the 'transactions' collection in MongoDB
    collection: 'transactions',
  }
);

// Index on userId + date: fetch a user's transaction history sorted by date
transactionSchema.index({ userId: 1, date: -1 });

// Index on accountId + date: fetch transactions for a specific account
transactionSchema.index({ accountId: 1, date: -1 });

// Note: referenceNumber index is already created automatically by unique: true above.
// A separate schema.index({ referenceNumber: 1 }) would duplicate it, so it is omitted.

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
