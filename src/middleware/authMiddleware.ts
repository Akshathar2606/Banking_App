/**
 * authMiddleware.ts
 *
 * BankEase JWT Authentication Middleware
 *
 * Verifies the JWT access token on protected routes.
 * On success, attaches the verified user ID (from JWT `sub`) to req.userId.
 * The controller or next middleware reads req.userId — it NEVER trusts
 * a userId supplied by the client in the body, query, or URL params.
 *
 * SECURITY RULES:
 *  - JWT is read only from the Authorization header (Bearer scheme).
 *  - JWT_SECRET is read from environment variables — no hardcoded fallback.
 *  - The token is never logged or returned in a response.
 *  - req.userId is only set after successful cryptographic verification.
 *
 * DEMO / STUDENT APPLICATION:
 *  Not connected to real banking systems, real money, or payment gateways.
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// ─── Extend Express Request ───────────────────────────────────────────────────
// Declaration merging adds `userId` to Express's Request interface globally.
// This lets TypeScript recognise req.userId on any authenticated route handler
// without using `any` or casting.

declare global {
  namespace Express {
    interface Request {
      /**
       * The authenticated user's MongoDB ObjectId as a string.
       * Populated by authenticateToken middleware AFTER JWT verification.
       * Value comes exclusively from the verified JWT `sub` claim.
       */
      userId?: string;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Express middleware that verifies a JWT Bearer token.
 *
 * Flow:
 *  1. Read Authorization header — reject if missing or not Bearer format.
 *  2. Check JWT_SECRET is configured — reject with 500 if not.
 *  3. Verify the token cryptographically — reject if invalid or expired.
 *  4. Validate that the verified payload contains a non-empty string `sub`.
 *  5. Attach `sub` to req.userId and call next().
 *
 * Usage:
 *  router.get('/protected', authenticateToken, myController);
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // ── 1. Read and validate the Authorization header ─────────────────────────
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  // Header must follow exactly: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const token = parts[1];

  // ── 2. Ensure JWT_SECRET is configured ────────────────────────────────────
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === '') {
    // Environment misconfiguration — do not expose details to the client
    res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
    return;
  }

  // ── 3. Verify the token cryptographically ────────────────────────────────
  let decoded: JwtPayload;

  try {
    const result = jwt.verify(token, secret);

    // jwt.verify returns string for legacy tokens — we require an object payload
    if (typeof result === 'string') {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    decoded = result;
  } catch {
    // Covers TokenExpiredError, JsonWebTokenError, NotBeforeError, etc.
    // A single generic message prevents leaking token structure details.
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // ── 4. Validate the `sub` claim ───────────────────────────────────────────
  // `sub` must be a non-empty string — reject anything else
  const sub = decoded.sub;

  if (!sub || typeof sub !== 'string' || sub.trim() === '') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // ── 5. Attach verified userId and continue ────────────────────────────────
  // Only reaches here after full cryptographic verification.
  // req.userId is sourced exclusively from the verified JWT sub — never from
  // req.body, req.query, or req.params.
  req.userId = sub;

  next();
};
