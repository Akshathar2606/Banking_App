const express = require('express');
const {
  getBeneficiaries,
  getBeneficiaryById,
  addBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
} = require('../controllers/beneficiaryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET    /api/beneficiaries
router.get('/', protect, getBeneficiaries);

// GET    /api/beneficiaries/:id
router.get('/:id', protect, getBeneficiaryById);

// POST   /api/beneficiaries
router.post('/', protect, addBeneficiary);

// PATCH  /api/beneficiaries/:id
router.patch('/:id', protect, updateBeneficiary);

// DELETE /api/beneficiaries/:id
router.delete('/:id', protect, deleteBeneficiary);

module.exports = router;
