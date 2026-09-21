const Card = require('../models/Card');

// -------------------------------------------------------
// Helper: mask card number — show only last 4 digits
// Input:  "1234567890123333"  or  "1234 5678 9012 3333"
// Output: "**** **** **** 3333"
// -------------------------------------------------------
const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return '**** **** **** ****';
  // Strip all spaces/dashes to get raw digits
  const digits = cardNumber.replace(/[\s-]/g, '');
  const last4  = digits.slice(-4);
  return `**** **** **** ${last4}`;
};

// -------------------------------------------------------
// Helper: format a card document for safe API response.
// - Masks cardNumber to last 4 digits only.
// - Never includes CVV, PIN, OTP, or passwordHash
//   (none of which exist on the Card schema, but explicit
//   about what is intentionally returned).
// -------------------------------------------------------
const safeCard = (card) => ({
  _id:            card._id,
  userId:         card.userId,
  cardType:       card.cardType,
  cardNumber:     maskCardNumber(card.cardNumber),
  cardHolderName: card.cardHolderName,
  expiryMonth:    card.expiryMonth,
  expiryYear:     card.expiryYear,
  status:         card.status,
  createdAt:      card.createdAt,
});

// -------------------------------------------------------
// @desc    Get all cards for the authenticated user
// @route   GET /api/cards
// @access  Protected
// -------------------------------------------------------
const getCards = async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'Cards retrieved successfully',
      cards: cards.map(safeCard),
    });
  } catch (error) {
    console.error('getCards error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cards. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Get a single card by ID (must belong to authenticated user)
// @route   GET /api/cards/:id
// @access  Protected
// -------------------------------------------------------
const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    // Ownership check — prevent cross-user access
    if (card.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this card',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Card retrieved successfully',
      card: safeCard(card),
    });
  } catch (error) {
    console.error('getCardById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve card. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Block a card (status → "blocked")
// @route   PATCH /api/cards/:id/block
// @access  Protected
// -------------------------------------------------------
const blockCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    if (card.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this card',
      });
    }

    if (card.status === 'blocked') {
      return res.status(400).json({
        success: false,
        message: 'Card is already blocked',
      });
    }

    if (card.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block an expired card',
      });
    }

    // Only status is updated — client cannot change any other field
    const updated = await Card.findByIdAndUpdate(
      card._id,
      { status: 'blocked' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Card blocked successfully',
      card: safeCard(updated),
    });
  } catch (error) {
    console.error('blockCard error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to block card. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Unblock a card (status → "active")
// @route   PATCH /api/cards/:id/unblock
// @access  Protected
// -------------------------------------------------------
const unblockCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    if (card.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this card',
      });
    }

    if (card.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Card is already active',
      });
    }

    if (card.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Cannot unblock an expired card',
      });
    }

    const updated = await Card.findByIdAndUpdate(
      card._id,
      { status: 'active' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Card unblocked successfully',
      card: safeCard(updated),
    });
  } catch (error) {
    console.error('unblockCard error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to unblock card. Please try again later.',
    });
  }
};

module.exports = { getCards, getCardById, blockCard, unblockCard };
