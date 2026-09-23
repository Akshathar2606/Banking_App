const express = require('express');
const { getAccounts, getAccountById, depositFunds } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/accounts
router.get('/', protect, getAccounts);

// GET /api/accounts/:id
router.get('/:id', protect, getAccountById);

// POST /api/accounts/:id/deposit
router.post('/:id/deposit', protect, depositFunds);

module.exports = router;
