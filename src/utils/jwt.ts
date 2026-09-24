/**
 * jwt.ts
 *
 * BankEase JWT Utility — Access Token Generation
 *
 * SECURITY RULES:
 *  - JWT_SECRET is read exclusively from environment variables. No hardcoded fallback.
 *  - The payload contains ONLY { sub: userId }. No passwords, hashes, or sensitive data.
 *  - Generated tokens are never logged.
 *
 * DEMO / STUDENT APPLICATION:
 *  Not connected to real banking systems, real money, or payment gateways.
 */

import jwt, { SignOptions } from 'jsonwebtoken';

/** Access token lifetime — 1 hour. */
const ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '1h';

/**
 * Generates a signed JWT access token for an authenticated BankEase user.
 *
 * Payload: { sub: userId }
 * Expiry:  1 hour
 * Secret:  process.env.JWT_SECRET (must be set — no hardcoded fallback)
 *
 * @param userId - The authenticated user's MongoDB ObjectId as a string.
 * @returns A signed JWT string.
 * @throws Error if JWT_SECRET is not configured in the environment.
 *
 * @example
 * // Inside a login controller (future task):
 * const token = generateAccessToken(user.id);
 * res.json({ token });
 */
export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  // Guard: refuse to sign tokens if the secret is not configured.
  // A missing secret means the environment is misconfigured — fail loudly.
  if (!secret || secret.trim() === '') {
    throw new Error(
      'Server configuration error: JWT_SECRET is not set. ' +
      'Add JWT_SECRET to your .env file and restart the server.'
    );
  }

  const payload = {
    sub: userId,
  };

  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };

  return jwt.sign(payload, secret, options);
};
