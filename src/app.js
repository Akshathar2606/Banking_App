const express = require('express');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const billRoutes = require('./routes/billRoutes');
const cardRoutes = require('./routes/cardRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BankEase API is running',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

module.exports = app;
