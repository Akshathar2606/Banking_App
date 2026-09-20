// ===========================================
// BankEase - Demo Data Seeding Script
// src/tests/seedDemoData.js
//
// Run this with: npm run db:seed
//
// PURPOSE:
//   Inserts a small set of fictional demo records into MongoDB Atlas
//   so you can explore and test the BankEase database layer.
//
// SAFETY:
//   - All data is fictional. No real names, emails, or financial details.
//   - Passwords stored here are fake bcrypt-style hashes (not real hashes).
//   - Card numbers and account numbers are simulated for demo only.
//   - This script NEVER prints the MongoDB connection string or credentials.
//   - Duplicate-safe: checks for existing demo records before inserting.
// ===========================================

'use strict';

const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import all six models
const User        = require('../models/User');
const Account     = require('../models/Account');
const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const Card        = require('../models/Card');
const Bill        = require('../models/Bill');

// ===========================================
// DEMO DATA DEFINITIONS
// All values below are entirely fictional.
// ===========================================

// Fictional emails used as stable identifiers to detect existing demo records
const DEMO_USER_EMAILS = [
  'arjun.mehta.demo@bankease.test',
  'priya.sharma.demo@bankease.test',
];

// Fictional account numbers used to detect existing demo accounts
const DEMO_ACCOUNT_NUMBERS = ['DEMO10010001234', 'DEMO10010005678'];

// Fictional reference numbers used to detect existing demo transactions
const DEMO_REFERENCE_NUMBERS = [
  'BKREF-DEMO-001',
  'BKREF-DEMO-002',
  'BKREF-DEMO-003',
  'BKREF-DEMO-004',
];

// ===========================================
// HELPER: build demo users array
// ===========================================
function buildDemoUsers() {
  return [
    {
      name: 'Arjun Mehta',
      email: 'arjun.mehta.demo@bankease.test',
      phone: '9800000001',
      // Fake bcrypt-format hash — NOT a real password hash
      passwordHash: '$2b$10$DEMOfakeHashForArjunMehtaXXXXXXXXXXXXXXXXXXXXXXXXXX',
      profileImage: null,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma.demo@bankease.test',
      phone: '9800000002',
      // Fake bcrypt-format hash — NOT a real password hash
      passwordHash: '$2b$10$DEMOfakeHashForPriyaSharmaXXXXXXXXXXXXXXXXXXXXXXXXX',
      profileImage: null,
    },
  ];
}

// ===========================================
// HELPER: build demo accounts array
// Receives the inserted user documents so we
// can link accountId → real userId ObjectIds.
// ===========================================
function buildDemoAccounts(users) {
  return [
    {
      userId: users[0]._id,           // Arjun's savings account
      accountNumber: 'DEMO10010001234',
      accountType: 'savings',
      balance: 52000,                 // Simulated balance in INR (demo only)
      currency: 'INR',
    },
    {
      userId: users[1]._id,           // Priya's current account
      accountNumber: 'DEMO10010005678',
      accountType: 'current',
      balance: 128500,                // Simulated balance in INR (demo only)
      currency: 'INR',
    },
  ];
}

// ===========================================
// HELPER: build demo transactions array
// ===========================================
function buildDemoTransactions(users, accounts) {
  const now = new Date();

  // Helper to create a date N days ago
  const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

  return [
    {
      userId: users[0]._id,
      accountId: accounts[0]._id,
      type: 'credit',
      amount: 15000,
      description: 'Salary credit - Demo Employer Pvt Ltd',
      recipientName: null,
      referenceNumber: 'BKREF-DEMO-001',
      status: 'completed',
      date: daysAgo(10),
    },
    {
      userId: users[0]._id,
      accountId: accounts[0]._id,
      type: 'debit',
      amount: 3200,
      description: 'Online shopping - DemoMart',
      recipientName: 'DemoMart',
      referenceNumber: 'BKREF-DEMO-002',
      status: 'completed',
      date: daysAgo(7),
    },
    {
      userId: users[1]._id,
      accountId: accounts[1]._id,
      type: 'transfer',
      amount: 5000,
      description: 'Fund transfer to Arjun Mehta',
      recipientName: 'Arjun Mehta',
      referenceNumber: 'BKREF-DEMO-003',
      status: 'completed',
      date: daysAgo(3),
    },
    {
      userId: users[1]._id,
      accountId: accounts[1]._id,
      type: 'bill_payment',
      amount: 850,
      description: 'Electricity bill payment - Demo Power Corp',
      recipientName: 'Demo Power Corp',
      referenceNumber: 'BKREF-DEMO-004',
      status: 'completed',
      date: daysAgo(1),
    },
  ];
}

// ===========================================
// HELPER: build demo beneficiaries array
// ===========================================
function buildDemoBeneficiaries(users) {
  return [
    {
      userId: users[0]._id,
      name: 'Ravi Kumar',
      accountNumber: 'DEMO20020009999',  // Fictional account
      bankName: 'Demo National Bank',
      ifscCode: 'DEMO0001001',
      nickname: 'Ravi',
    },
    {
      userId: users[1]._id,
      name: 'Sunita Nair',
      accountNumber: 'DEMO20020008888',  // Fictional account
      bankName: 'Demo State Bank',
      ifscCode: 'DEMO0002002',
      nickname: 'Sunita',
    },
  ];
}

// ===========================================
// HELPER: build demo cards array
// ===========================================
function buildDemoCards(users) {
  return [
    {
      userId: users[0]._id,
      cardType: 'debit',
      // Simulated card number — starts with 0000 to make it obviously fake
      cardNumber: '0000-1111-2222-3333',
      cardHolderName: 'ARJUN MEHTA',
      expiryMonth: 8,
      expiryYear: 2028,
      status: 'active',
    },
    {
      userId: users[1]._id,
      cardType: 'credit',
      // Simulated card number — starts with 0000 to make it obviously fake
      cardNumber: '0000-4444-5555-6666',
      cardHolderName: 'PRIYA SHARMA',
      expiryMonth: 3,
      expiryYear: 2027,
      status: 'active',
    },
  ];
}

// ===========================================
// HELPER: build demo bills array
// ===========================================
function buildDemoBills(users) {
  const now = new Date();
  const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  return [
    {
      userId: users[0]._id,
      billerName: 'Demo Power Corporation',
      billType: 'electricity',
      consumerNumber: 'DPC-DEMO-00112',
      amount: 1240,
      dueDate: daysFromNow(5),    // Due in 5 days
      status: 'pending',
      paidAt: null,
    },
    {
      userId: users[1]._id,
      billerName: 'Demo Broadband Services',
      billType: 'internet',
      consumerNumber: 'DBS-DEMO-00456',
      amount: 699,
      dueDate: daysAgo(2),        // Already overdue
      status: 'overdue',
      paidAt: null,
    },
  ];
}

// ===========================================
// MAIN SEEDING FUNCTION
// ===========================================
async function seedDemoData() {
  console.log('==========================================');
  console.log('  BankEase - Demo Data Seeding Script');
  console.log('==========================================');
  console.log('Connecting to MongoDB Atlas...\n');

  try {
    await connectDB();
    console.log('Database connection established.\n');

    // ------------------------------------------
    // STEP 1: USERS
    // Check by email — emails are unique in the User model
    // ------------------------------------------
    const existingUsers = await User.find({
      email: { $in: DEMO_USER_EMAILS },
    });

    let users;

    if (existingUsers.length === DEMO_USER_EMAILS.length) {
      console.log('Demo users already exist — skipping insert.');
      users = existingUsers;
    } else {
      // Remove any partial demo users before re-inserting cleanly
      await User.deleteMany({ email: { $in: DEMO_USER_EMAILS } });

      const inserted = await User.insertMany(buildDemoUsers());
      users = inserted;
      console.log(`Demo users inserted (${users.length} records).`);
    }

    // ------------------------------------------
    // STEP 2: ACCOUNTS
    // Check by accountNumber — unique in the Account model
    // ------------------------------------------
    const existingAccounts = await Account.find({
      accountNumber: { $in: DEMO_ACCOUNT_NUMBERS },
    });

    let accounts;

    if (existingAccounts.length === DEMO_ACCOUNT_NUMBERS.length) {
      console.log('Demo accounts already exist — skipping insert.');
      accounts = existingAccounts;
    } else {
      await Account.deleteMany({ accountNumber: { $in: DEMO_ACCOUNT_NUMBERS } });

      const inserted = await Account.insertMany(buildDemoAccounts(users));
      accounts = inserted;
      console.log(`Demo accounts inserted (${accounts.length} records).`);
    }

    // ------------------------------------------
    // STEP 3: TRANSACTIONS
    // Check by referenceNumber — unique in Transaction model
    // ------------------------------------------
    const existingTxns = await Transaction.find({
      referenceNumber: { $in: DEMO_REFERENCE_NUMBERS },
    });

    let transactions;

    if (existingTxns.length === DEMO_REFERENCE_NUMBERS.length) {
      console.log('Demo transactions already exist — skipping insert.');
      transactions = existingTxns;
    } else {
      await Transaction.deleteMany({
        referenceNumber: { $in: DEMO_REFERENCE_NUMBERS },
      });

      const inserted = await Transaction.insertMany(
        buildDemoTransactions(users, accounts)
      );
      transactions = inserted;
      console.log(`Demo transactions inserted (${transactions.length} records).`);
    }

    // ------------------------------------------
    // STEP 4: BENEFICIARIES
    // Beneficiary has a compound unique index on {userId + accountNumber}.
    // We match on userId + accountNumber pairs to detect existing records.
    // ------------------------------------------
    const existingBeneficiaries = await Beneficiary.find({
      $or: [
        { userId: users[0]._id, accountNumber: 'DEMO20020009999' },
        { userId: users[1]._id, accountNumber: 'DEMO20020008888' },
      ],
    });

    let beneficiaries;

    if (existingBeneficiaries.length === 2) {
      console.log('Demo beneficiaries already exist — skipping insert.');
      beneficiaries = existingBeneficiaries;
    } else {
      await Beneficiary.deleteMany({
        $or: [
          { userId: users[0]._id, accountNumber: 'DEMO20020009999' },
          { userId: users[1]._id, accountNumber: 'DEMO20020008888' },
        ],
      });

      const inserted = await Beneficiary.insertMany(buildDemoBeneficiaries(users));
      beneficiaries = inserted;
      console.log(`Demo beneficiaries inserted (${beneficiaries.length} records).`);
    }

    // ------------------------------------------
    // STEP 5: CARDS
    // Card has no unique constraint, so we match on userId + cardNumber.
    // ------------------------------------------
    const existingCards = await Card.find({
      $or: [
        { userId: users[0]._id, cardNumber: '0000-1111-2222-3333' },
        { userId: users[1]._id, cardNumber: '0000-4444-5555-6666' },
      ],
    });

    let cards;

    if (existingCards.length === 2) {
      console.log('Demo cards already exist — skipping insert.');
      cards = existingCards;
    } else {
      await Card.deleteMany({
        $or: [
          { userId: users[0]._id, cardNumber: '0000-1111-2222-3333' },
          { userId: users[1]._id, cardNumber: '0000-4444-5555-6666' },
        ],
      });

      const inserted = await Card.insertMany(buildDemoCards(users));
      cards = inserted;
      console.log(`Demo cards inserted (${cards.length} records).`);
    }

    // ------------------------------------------
    // STEP 6: BILLS
    // Match on userId + consumerNumber to detect existing demo bills.
    // ------------------------------------------
    const existingBills = await Bill.find({
      $or: [
        { userId: users[0]._id, consumerNumber: 'DPC-DEMO-00112' },
        { userId: users[1]._id, consumerNumber: 'DBS-DEMO-00456' },
      ],
    });

    let bills;

    if (existingBills.length === 2) {
      console.log('Demo bills already exist — skipping insert.');
      bills = existingBills;
    } else {
      await Bill.deleteMany({
        $or: [
          { userId: users[0]._id, consumerNumber: 'DPC-DEMO-00112' },
          { userId: users[1]._id, consumerNumber: 'DBS-DEMO-00456' },
        ],
      });

      const inserted = await Bill.insertMany(buildDemoBills(users));
      bills = inserted;
      console.log(`Demo bills inserted (${bills.length} records).`);
    }

    // ------------------------------------------
    // SUMMARY
    // ------------------------------------------
    console.log('\n------------------------------------------');
    console.log('  Demo data seeding completed successfully');
    console.log('------------------------------------------');
    console.log(`  Users        : ${users.length}`);
    console.log(`  Accounts     : ${accounts.length}`);
    console.log(`  Transactions : ${transactions.length}`);
    console.log(`  Beneficiaries: ${beneficiaries.length}`);
    console.log(`  Cards        : ${cards.length}`);
    console.log(`  Bills        : ${bills.length}`);
    console.log('------------------------------------------\n');

  } catch (error) {
    // Print the error message only — never print the connection string or credentials
    console.error('\nSeeding failed.');
    console.error('Error:', error.message);
    process.exit(1);

  } finally {
    // Always close the connection cleanly when the script ends
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the seeder
seedDemoData();
