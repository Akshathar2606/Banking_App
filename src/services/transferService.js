const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// -------------------------------------------------------
// Generate a unique transaction reference
// Format: TXN-<timestamp>-<random hex>
// -------------------------------------------------------
const generateReference = () => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${ts}-${rnd}`;
};

// -------------------------------------------------------
// @desc  Execute a transfer between two accounts atomically.
//        All balance updates and transaction records are wrapped
//        in a MongoDB session so they succeed or fail together.
//
// @param {string} authenticatedUserId  - req.user._id (never user-supplied)
// @param {string} fromAccountId        - source account _id
// @param {string} toAccountId          - recipient account _id
// @param {number} amount               - positive transfer amount
// @param {string} description          - optional memo
//
// @returns {object} the created Transaction document
// @throws  {object} { status, message } on any business-rule or DB error
// -------------------------------------------------------
const executeTransfer = async (
  authenticatedUserId,
  fromAccountId,
  toAccountId,
  amount,
  description
) => {
  // --- 1. Load both accounts ---
  const fromAccount = await Account.findById(fromAccountId);
  const toAccount   = await Account.findById(toAccountId);

  if (!fromAccount) {
    throw { status: 404, message: 'Source account not found' };
  }
  if (!toAccount) {
    throw { status: 404, message: 'Recipient account not found' };
  }

  // --- 2. Source account must belong to the authenticated user ---
  if (fromAccount.userId.toString() !== authenticatedUserId.toString()) {
    throw { status: 403, message: 'Not authorized to transfer from this account' };
  }

  // --- 3. Both accounts must be active ---
  if (fromAccount.status !== 'active') {
    throw { status: 400, message: 'Source account is not active' };
  }
  if (toAccount.status !== 'active') {
    throw { status: 400, message: 'Recipient account is not active' };
  }

  // --- 4. Sufficient balance check ---
  if (fromAccount.balance < amount) {
    throw { status: 400, message: 'Insufficient balance in source account' };
  }

  // --- 5. Execute atomically inside a MongoDB session ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deduct from source
    await Account.findByIdAndUpdate(
      fromAccountId,
      { $inc: { balance: -amount } },
      { session }
    );

    // Credit to recipient
    await Account.findByIdAndUpdate(
      toAccountId,
      { $inc: { balance: amount } },
      { session }
    );

    // Create the transaction record
    const [transaction] = await Transaction.create(
      [
        {
          userId:        authenticatedUserId,
          accountId:     fromAccountId,
          type:          'transfer',
          amount,
          recipientId:   toAccountId,
          recipientName: toAccount.accountNumber, // use account number as identifier
          description:   description || null,
          status:        'completed',
          reference:     generateReference(),
          date:          new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    // Re-throw with a safe generic message so the controller doesn't leak internals
    throw { status: 500, message: 'Transfer failed due to an internal error. Please try again.' };
  } finally {
    session.endSession();
  }
};

module.exports = { executeTransfer };
