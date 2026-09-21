const Beneficiary = require('../models/Beneficiary');

// -------------------------------------------------------
// Helper: check if a MongoDB error is a duplicate key violation
// -------------------------------------------------------
const isDuplicateKeyError = (error) =>
  error.code === 11000 || error.name === 'MongoServerError' && error.code === 11000;

// -------------------------------------------------------
// @desc    Get all beneficiaries for the authenticated user
// @route   GET /api/beneficiaries
// @access  Protected
// -------------------------------------------------------
const getBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Beneficiaries retrieved successfully',
      beneficiaries,
    });
  } catch (error) {
    console.error('getBeneficiaries error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve beneficiaries. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Get a single beneficiary by ID (must belong to authenticated user)
// @route   GET /api/beneficiaries/:id
// @access  Protected
// -------------------------------------------------------
const getBeneficiaryById = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Ownership check
    if (beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this beneficiary',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Beneficiary retrieved successfully',
      beneficiary,
    });
  } catch (error) {
    console.error('getBeneficiaryById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve beneficiary. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Add a new beneficiary
// @route   POST /api/beneficiaries
// @access  Protected
// -------------------------------------------------------
const addBeneficiary = async (req, res) => {
  try {
    const { name, accountNumber, bankName, ifscCode, nickname } = req.body;

    // Presence validation for required fields
    if (!name || !accountNumber || !bankName || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'name, accountNumber, bankName, and ifscCode are required',
      });
    }

    // userId always comes from the authenticated user — never from the request body
    const beneficiary = await Beneficiary.create({
      userId: req.user._id,
      name,
      accountNumber,
      bankName,
      ifscCode,
      nickname: nickname || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      beneficiary,
    });
  } catch (error) {
    // Compound unique index violation: same user + same accountNumber
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({
        success: false,
        message: 'This account number is already saved as a beneficiary',
      });
    }
    console.error('addBeneficiary error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to add beneficiary. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Update a beneficiary
// @route   PATCH /api/beneficiaries/:id
// @access  Protected
// Allowed updates: name, bankName, ifscCode, nickname, isActive
// NOT allowed:     userId, accountNumber
// -------------------------------------------------------
const updateBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Ownership check
    if (beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this beneficiary',
      });
    }

    // Build update object from only the allowed fields — ignore everything else
    const { name, bankName, ifscCode, nickname, isActive } = req.body;
    const updates = {};
    if (name      !== undefined) updates.name      = name;
    if (bankName  !== undefined) updates.bankName  = bankName;
    if (ifscCode  !== undefined) updates.ifscCode  = ifscCode;
    if (nickname  !== undefined) updates.nickname  = nickname;
    if (isActive  !== undefined) updates.isActive  = isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update. Updatable fields: name, bankName, ifscCode, nickname, isActive',
      });
    }

    const updated = await Beneficiary.findByIdAndUpdate(
      beneficiary._id,
      updates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Beneficiary updated successfully',
      beneficiary: updated,
    });
  } catch (error) {
    console.error('updateBeneficiary error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update beneficiary. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Delete a beneficiary
// @route   DELETE /api/beneficiaries/:id
// @access  Protected
// -------------------------------------------------------
const deleteBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Ownership check
    if (beneficiary.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this beneficiary',
      });
    }

    await Beneficiary.deleteOne({ _id: beneficiary._id });

    return res.status(200).json({
      success: true,
      message: 'Beneficiary deleted successfully',
    });
  } catch (error) {
    console.error('deleteBeneficiary error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete beneficiary. Please try again later.',
    });
  }
};

module.exports = {
  getBeneficiaries,
  getBeneficiaryById,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
};
