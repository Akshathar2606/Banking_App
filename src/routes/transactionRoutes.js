const express = require('express');
const { transferFunds, getTransactions } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/transactions/transfer
router.post('/transfer', protect, transferFunds);

// GET /api/transactions
router.get('/', protect, getTransactions);

module.exports = router;
