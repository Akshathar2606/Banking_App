const express = require('express');
const { getCards, getCardById, blockCard, unblockCard } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/cards
router.get('/', protect, getCards);

// GET /api/cards/:id
router.get('/:id', protect, getCardById);

// PATCH /api/cards/:id/block
router.patch('/:id/block', protect, blockCard);

// PATCH /api/cards/:id/unblock
router.patch('/:id/unblock', protect, unblockCard);

module.exports = router;
