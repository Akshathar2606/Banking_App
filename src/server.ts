/**
 * server.ts
 *
 * BankEase Backend Server Entry Point
 * Configures Express, CORS, JSON parsing, auth routes, health check,
 * and initializes the MongoDB database connection.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
const accountRoutes = require('./routes/accountRoutes');

// Load environment variables from .env file
dotenv.config();

// Import database connection module (Deepika's database.js)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const connectDB = require('./config/db');

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'BankEase backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
// DEMO DATA - remove later
app.get('/api/accounts', (_req, res) => {
  res.json({
    success: true,
    accounts: [
      {
        _id: 'demo-account-001',
        userId: 'demo-user',
        accountNumber: 'XXXX XXXX 4582',
        accountType: 'savings',
        balance: 75000,
        currency: 'INR',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// DEMO TRANSACTIONS - dummy data
app.get('/api/transactions', (_req, res) => {
  res.json({
    success: true,
    transactions: [
      {
        _id: 'txn-001',
        type: 'credit',
        transactionType: 'transfer',
        amount: 25000,
        description: 'Salary Credit',
        status: 'completed',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'txn-002',
        type: 'debit',
        transactionType: 'transfer',
        amount: 5000,
        description: 'Money sent to Rahul',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: 'txn-003',
        type: 'debit',
        transactionType: 'bill',
        amount: 2500,
        description: 'Electricity Bill',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        _id: 'txn-004',
        type: 'debit',
        transactionType: 'bill',
        amount: 1200,
        description: 'Internet Bill',
        status: 'completed',
        createdAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        _id: 'txn-005',
        type: 'debit',
        transactionType: 'transfer',
        amount: 1500,
        description: 'Money sent to Priya',
        status: 'completed',
        createdAt: new Date(Date.now() - 345600000).toISOString()
      }
    ]
  });
});// DEMO CARDS - dummy data
app.get('/api/cards', (_req, res) => {
  res.json({
    success: true,
    cards: [
      {
        _id: 'card-001',
        cardNumber: '4582',
        cardType: 'Debit Card',
        cardName: 'BankEase Debit Card',
        cardHolderName: 'Test User',
        expiryDate: '12/29',
        status: 'active',
        network: 'VISA'
      },
      {
        _id: 'card-002',
        cardNumber: '7816',
        cardType: 'Credit Card',
        cardName: 'BankEase Credit Card',
        cardHolderName: 'Test User',
        expiryDate: '08/30',
        status: 'active',
        network: 'VISA'
      }
    ]
  });
});
// DEMO BILLS - dummy data
app.get('/api/bills', (_req, res) => {
  res.json({
    success: true,
    bills: [
      {
        _id: 'bill-001',
        billerName: 'BESCOM',
        billType: 'Electricity',
        customerNumber: '123456789',
        amount: 1250,
        dueDate: '2026-10-05',
        status: 'pending'
      },
      {
        _id: 'bill-002',
        billerName: 'Airtel',
        billType: 'Mobile',
        customerNumber: '9876543210',
        amount: 599,
        dueDate: '2026-10-08',
        status: 'pending'
      },
      {
        _id: 'bill-003',
        billerName: 'JioFiber',
        billType: 'Internet',
        customerNumber: 'JIO123456',
        amount: 999,
        dueDate: '2026-10-12',
        status: 'pending'
      }
    ]
  });
});
// DEMO BENEFICIARIES - dummy data
app.get('/api/beneficiaries', (_req, res) => {
  res.json({
    success: true,
    beneficiaries: [
      {
        _id: 'beneficiary-001',
        name: 'Rahul Kumar',
        accountNumber: 'XXXX XXXX 1234',
        bankName: 'State Bank of India',
        ifsc: 'SBIN0001234',
        nickname: 'Rahul'
      },
      {
        _id: 'beneficiary-002',
        name: 'Priya Sharma',
        accountNumber: 'XXXX XXXX 5678',
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0001234',
        nickname: 'Priya'
      },
      {
        _id: 'beneficiary-003',
        name: 'Amit Enterprises',
        accountNumber: 'XXXX XXXX 9012',
        bankName: 'ICICI Bank',
        ifsc: 'ICIC0001234',
        nickname: 'Amit'
      }
    ]
  });
});
// Account routes
app.use('/api/accounts', accountRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

export const startServer = async () => {
  const server = app.listen(PORT, () => {
    console.log(`✅ BankEase backend running on http://localhost:${PORT}`);
    console.log(`🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error: any) {
    console.warn(`⚠️ MongoDB connection note: ${error.message}`);
  }

  return server;
};

// Auto-start server when executed directly
if (require.main === module) {
  startServer();
}

export default app;
