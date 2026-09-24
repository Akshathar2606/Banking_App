const mongoose = require('mongoose');
const Account     = require('../models/Account');
const Transaction = require('../models/Transaction');

// -------------------------------------------------------
// Helper: generate a unique transaction reference
// Same format used by transferService.js and billController.js
// -------------------------------------------------------
const generateReference = () => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${ts}-${rnd}`;
};

// -------------------------------------------------------
// @desc    Get all accounts belonging to the logged-in user
// @route   GET /api/accounts
// @access  Protected
// -------------------------------------------------------
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('getAccounts error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve accounts. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Get a single account by ID (must belong to logged-in user)
// @route   GET /api/accounts/:id
// @access  Protected
// -------------------------------------------------------
const getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    // 1. Account does not exist
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // 2. Account belongs to a different user
    if (account.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this account',
      });
    }

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    console.error('getAccountById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve account. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Deposit money into the authenticated user's account
// @route   POST /api/accounts/:id/deposit
// @access  Protected
// -------------------------------------------------------
const depositFunds = async (req, res) => {
  try {
    const { amount, description } = req.body;

    // 1. Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'amount is required',
      });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number greater than 0',
      });
    }

    // 2. Find account
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // 3. Ownership check — client can never deposit into another user's account
    if (account.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to deposit into this account',
      });
    }

    // 4. Account must be active
    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deposit into an inactive account',
      });
    }

    // 5. Execute atomically — credit balance and create transaction record
    const session = await mongoose.startSession();
    session.startTransaction();

    let transaction;
    try {
      await Account.findByIdAndUpdate(
        account._id,
        { $inc: { balance: amount } },
        { session }
      );

      const [created] = await Transaction.create(
        [
          {
            userId:       req.user._id,
            accountId:    account._id,
            type:         'deposit',
            amount,
            description:  description || 'Money added',
            status:       'completed',
            reference:    generateReference(),
            date:         new Date(),
          },
        ],
        { session }
      );
      transaction = created;

      await session.commitTransaction();
    } catch (dbError) {
      await session.abortTransaction();
      console.error('depositFunds session error:', dbError.message);
      throw { status: 500, message: 'Deposit failed due to an internal error. Please try again.' };
    } finally {
      session.endSession();
    }

    return res.status(201).json({
      success: true,
      message: 'Money added successfully',
      transaction,
    });
  } catch (error) {
    if (error.status && error.message) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    console.error('depositFunds error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Deposit failed. Please try again later.',
    });
  }
};

module.exports = { getAccounts, getAccountById, depositFunds };
