const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['transfer', 'deposit', 'withdrawal', 'bill_payment'],
        message: 'Type must be transfer, deposit, withdrawal, or bill_payment',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    // Optional — only relevant for transfers; null for deposits/withdrawals
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    recipientName: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: ['pending', 'completed', 'failed', 'cancelled'],
        message: 'Status must be pending, completed, failed, or cancelled',
      },
    },
    // Unique reference ID for this transaction (e.g. a UUID)
    reference: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true,
      trim: true,
    },
    // Explicit transaction date — separate from createdAt/updatedAt
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,           // auto-manages createdAt and updatedAt
    collection: 'transactions', // explicit MongoDB collection name
  }
);

// Compound indexes for efficient transaction history queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ accountId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
