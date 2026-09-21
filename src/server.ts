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

// Load environment variables from .env file
dotenv.config();

// Import database connection module (Deepika's database.js)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const connectDB = require('./config/database');

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
