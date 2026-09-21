const express = require('express');
const { getAccounts, getAccountById } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/accounts
router.get('/', protect, getAccounts);

// GET /api/accounts/:id
router.get('/:id', protect, getAccountById);

module.exports = router;
