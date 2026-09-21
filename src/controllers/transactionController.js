const Transaction = require('../models/Transaction');
const { executeTransfer } = require('../services/transferService');

// -------------------------------------------------------
// @desc    Transfer funds between two accounts
// @route   POST /api/transactions/transfer
// @access  Protected
// -------------------------------------------------------
const transferFunds = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // --- Input validation ---
    if (!fromAccountId || !toAccountId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'fromAccountId, toAccountId, and amount are required',
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number greater than 0',
      });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Source and recipient accounts must be different',
      });
    }

    // Delegate all business logic and atomicity to the service layer
    // Always use req.user._id — never trust a user-supplied userId
    const transaction = await executeTransfer(
      req.user._id,
      fromAccountId,
      toAccountId,
      amount,
      description
    );

    return res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      transaction,
    });
  } catch (error) {
    // Business-rule errors thrown by the service include a status code
    if (error.status && error.message) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    // Unexpected errors — do not expose internals
    console.error('transferFunds error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Transfer failed. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Get all transactions for the logged-in user
// @route   GET /api/transactions
// @access  Protected
// -------------------------------------------------------
const getTransactions = async (req, res) => {
  try {
    // Sort newest first using the existing { userId: 1, date: -1 } index
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('getTransactions error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions. Please try again later.',
    });
  }
};

module.exports = { transferFunds, getTransactions };
