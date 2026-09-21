const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      trim: true,
      uppercase: true,
    },
    // Optional short name the user gives this beneficiary (e.g. "Mom", "Landlord")
    nickname: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,             // auto-manages createdAt and updatedAt
    collection: 'beneficiaries',  // explicit MongoDB collection name
  }
);

// Compound unique index — prevents the same user from adding the same account number twice
beneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
