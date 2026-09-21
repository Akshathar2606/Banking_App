/**
 * authRoutes.ts
 *
 * Express Router for BankEase authentication endpoints.
 * Routes:
 *   POST /api/auth/register - Register a new user
 *   POST /api/auth/login    - Authenticate user and return JWT
 *   GET  /api/auth/me       - Protected endpoint returning authenticated user profile
 */

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require valid JWT Bearer token)
router.get('/me', authenticateToken, getMe);

export default router;
