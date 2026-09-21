const Account = require('../models/Account');

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

module.exports = { getAccounts, getAccountById };
