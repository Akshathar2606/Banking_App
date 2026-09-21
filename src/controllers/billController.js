const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// -------------------------------------------------------
// Helper: generate a unique transaction reference
// Mirrors the same format used in transferService.js
// -------------------------------------------------------
const generateReference = () => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${ts}-${rnd}`;
};

// -------------------------------------------------------
// @desc    Get all bills for the authenticated user
// @route   GET /api/bills
// @access  Protected
// Query:   ?status=pending  (optional; comma-separated values also accepted)
// -------------------------------------------------------
const getBills = async (req, res) => {
  try {
    const query = { userId: req.user._id };

    // Optional status filter — e.g. ?status=pending or ?status=pending,overdue
    if (req.query.status) {
      const requested = req.query.status.split(',').map(s => s.trim().toLowerCase());
      const valid = ['pending', 'paid', 'overdue'];
      const filtered = requested.filter(s => valid.includes(s));
      if (filtered.length > 0) {
        query.status = { $in: filtered };
      }
    }

    // pending/overdue: sort by dueDate ascending (most urgent first)
    // paid: sort by createdAt descending (most recent first)
    const hasPaidOnly =
      req.query.status &&
      req.query.status.split(',').every(s => s.trim() === 'paid');

    const sortOrder = hasPaidOnly ? { createdAt: -1 } : { dueDate: 1 };

    const bills = await Bill.find(query).sort(sortOrder);

    return res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      bills,
    });
  } catch (error) {
    console.error('getBills error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bills. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Get a single bill by ID (must belong to authenticated user)
// @route   GET /api/bills/:id
// @access  Protected
// -------------------------------------------------------
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // Ownership check — prevent cross-user access
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this bill',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bill retrieved successfully',
      bill,
    });
  } catch (error) {
    console.error('getBillById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bill. Please try again later.',
    });
  }
};

// -------------------------------------------------------
// @desc    Pay a bill atomically
// @route   POST /api/bills/:id/pay
// @access  Protected
// Body:    { accountId: "<account _id to debit>" }
//
// The payment amount is ALWAYS read from the bill document.
// The client can never specify or override the amount.
// -------------------------------------------------------
const payBill = async (req, res) => {
  try {
    const { accountId } = req.body;

    // 1. accountId is required — the client must specify which account to debit
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required to specify which account to debit',
      });
    }

    // 2. Load the bill
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // 3. Ownership check
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay this bill',
      });
    }

    // 4. Only pending or overdue bills can be paid
    if (bill.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This bill has already been paid',
      });
    }
    if (!['pending', 'overdue'].includes(bill.status)) {
      return res.status(400).json({
        success: false,
        message: `Bill cannot be paid in its current status: ${bill.status}`,
      });
    }

    // 5. Load and validate the account
    const account = await Account.findById(accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Payment account not found',
      });
    }

    // 6. Account must belong to the authenticated user
    if (account.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to debit this account',
      });
    }

    // 7. Account must be active
    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Payment account is not active',
      });
    }

    // 8. Sufficient balance check — amount always comes from the bill, never the client
    const paymentAmount = bill.amount;
    if (account.balance < paymentAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ${paymentAmount}, Available: ${account.balance}`,
      });
    }

    // 9. Execute atomically — debit account, mark bill paid, create transaction record
    const session = await mongoose.startSession();
    session.startTransaction();

    let transaction;
    try {
      // Deduct from account
      await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: -paymentAmount } },
        { session }
      );

      // Mark bill as paid — use findByIdAndUpdate to stay in session scope
      await Bill.findByIdAndUpdate(
        bill._id,
        { status: 'paid', paidAt: new Date() },
        { session }
      );

      // Create transaction record
      const [created] = await Transaction.create(
        [
          {
            userId:      req.user._id,
            accountId,
            type:        'bill_payment',
            amount:      paymentAmount,
            recipientId: null,
            recipientName: bill.billerName,
            description: `Bill payment — ${bill.billerName} (${bill.billType}) #${bill.consumerNumber}`,
            status:      'completed',
            reference:   generateReference(),
            date:        new Date(),
          },
        ],
        { session }
      );
      transaction = created;

      await session.commitTransaction();
    } catch (dbError) {
      await session.abortTransaction();
      console.error('payBill session error:', dbError.message);
      throw { status: 500, message: 'Payment failed due to an internal error. Please try again.' };
    } finally {
      session.endSession();
    }

    // Re-fetch the updated bill to return its current state
    const updatedBill = await Bill.findById(bill._id);

    return res.status(200).json({
      success: true,
      message: 'Bill payment successful',
      bill: updatedBill,
      transaction,
    });
  } catch (error) {
    if (error.status && error.message) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    console.error('payBill error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Payment failed. Please try again later.',
    });
  }
};

module.exports = { getBills, getBillById, payBill };
