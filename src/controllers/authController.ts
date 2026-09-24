/**
 * authController.ts
 *
 * BankEase Authentication Controller
 * Handles HTTP requests for user registration, login, and profile lookup.
 *
 * SECURITY RULES:
 *  - Plain text passwords and JWT tokens are NEVER logged.
 *  - Responses NEVER contain passwordHash.
 *  - Login failures use generic error messages ("Invalid email or password").
 *  - Database internals / stack traces are never exposed in responses.
 */

import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  AuthError,
  UserRepository,
  toSafeUser,
} from '../services/authService';
import { mongooseUserRepository } from '../services/userRepository';

let activeRepo: UserRepository = mongooseUserRepository;

/**
 * Allows swapping the repository for testing purposes.
 */
export const setTestUserRepository = (repo: UserRepository): void => {
  activeRepo = repo;
};

/**
 * Restores the default Mongoose repository.
 */
export const resetUserRepository = (): void => {
  activeRepo = mongooseUserRepository;
};

/**
 * POST /api/auth/register
 * Registers a new user with name, email, phone, and password.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    const result = await registerUser(
      { name, email, phone, password },
      activeRepo
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Handle Mongo duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
      return;
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const firstMessage =
        Object.values(error.errors || {})[0] &&
        (Object.values(error.errors || {})[0] as any).message;
      res.status(400).json({
        success: false,
        message: firstMessage || 'Validation error',
      });
      return;
    }

    console.error('[Registration Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns safe user data with a signed JWT.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password }, activeRepo);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('[Login Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.',
    });
  }
};

/**
 * GET /api/auth/me
 * Retrieves the authenticated user's profile.
 * Protected by authenticateToken middleware — req.userId is set from JWT `sub`.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!activeRepo.findById) {
      res.status(500).json({
        success: false,
        message: 'Repository does not support findById',
      });
      return;
    }

    const doc = await activeRepo.findById(userId);
    if (!doc) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: toSafeUser(doc),
    });
  } catch (error: any) {
    console.error('[Profile Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
    });
  }
};
