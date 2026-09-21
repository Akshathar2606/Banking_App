const express = require('express');
const { getBills, getBillById, payBill } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/bills
router.get('/', protect, getBills);

// GET /api/bills/:id
router.get('/:id', protect, getBillById);

// POST /api/bills/:id/pay
router.post('/:id/pay', protect, payBill);

module.exports = router;
