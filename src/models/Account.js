const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
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
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['savings', 'current'],
        message: 'Account type must be either savings or current',
      },
    },
    balance: {
      type: Number,
      required: [true, 'Balance is required'],
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      default: 'active',
      enum: {
        values: ['active', 'frozen', 'closed'],
        message: 'Status must be active, frozen, or closed',
      },
    },
  },
  {
    timestamps: true,       // auto-manages createdAt and updatedAt
    collection: 'accounts', // explicit MongoDB collection name
  }
);

// Index on userId to quickly fetch all accounts for a user
accountSchema.index({ userId: 1 });

module.exports = mongoose.model('Account', accountSchema);
