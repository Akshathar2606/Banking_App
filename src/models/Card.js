// ===========================================
// BankEase - Card Model
// src/models/Card.js
// ===========================================
// Represents a debit or credit card linked to a user.
// IMPORTANT: This is demo data only.
// Do NOT store real card numbers or financial information here.

const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    // The user this card belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Whether this is a debit card or a credit card
    cardType: {
      type: String,
      required: [true, 'Card type is required'],
      enum: {
        values: ['debit', 'credit'],
        message: 'Card type must be either "debit" or "credit"',
      },
    },

    // Simulated card number — demo data only, NOT a real card number
    cardNumber: {
      type: String,
      required: [true, 'Card number is required'],
      trim: true,
    },

    // Name printed on the card
    cardHolderName: {
      type: String,
      required: [true, 'Card holder name is required'],
      trim: true,
      uppercase: true,
    },

    // Expiry month as a number (1–12)
    expiryMonth: {
      type: Number,
      required: [true, 'Expiry month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },

    // Expiry year as a 4-digit number (e.g. 2027)
    expiryYear: {
      type: Number,
      required: [true, 'Expiry year is required'],
      min: [2024, 'Expiry year seems too far in the past'],
    },

    // Current state of the card
    status: {
      type: String,
      required: [true, 'Card status is required'],
      enum: {
        values: ['active', 'blocked', 'expired'],
        message: 'Status must be active, blocked, or expired',
      },
      default: 'active',
    },
  },
  {
    // Automatically adds createdAt field
    timestamps: { createdAt: true, updatedAt: false },

    // Maps to the 'cards' collection in MongoDB
    collection: 'cards',
  }
);

// Index on userId to quickly retrieve all cards for a user
cardSchema.index({ userId: 1 });

// Index on status — useful for filtering active/blocked cards
cardSchema.index({ userId: 1, status: 1 });

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
