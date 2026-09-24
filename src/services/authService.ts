/**
 * authService.ts
 *
 * BankEase Authentication Service — Registration + Login
 *
 * OWNERSHIP & INTEGRATION:
 *   The User model/database layer is owned by Member 3 (Deepika).
 *   This service integrates with it via the UserRepository interface
 *   and supports all schema requirements, including the required `phone` field.
 *
 * SECURITY:
 *   - Plain text passwords are NEVER stored or logged; hashed using bcrypt.
 *   - passwordHash is strictly excluded from returned objects.
 *   - Generic error messages ("Invalid email or password") prevent user enumeration.
 *   - Signs JWTs containing the user ID in the `sub` claim.
 *
 * DEMO / STUDENT APPLICATION:
 *   Not connected to real banking systems, real money, or payment gateways.
 */

import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Input accepted by registerUser — mirrors the HTTP request body shape. */
export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Input accepted by loginUser — mirrors the HTTP request body shape. */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Safe user data returned to callers.
 * passwordHash is intentionally excluded — it must NEVER leave the service layer.
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string | null;
}

/**
 * Result returned by authentication operations (login and registration).
 * Includes both the safe user profile and a signed JWT access token.
 */
export interface AuthResult {
  user: SafeUser;
  token: string;
}

/**
 * The shape of a persisted user document that this service needs.
 * Deepika's Mongoose User Document satisfies this contract.
 */
export interface UserDocument {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  profileImage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Repository interface that abstracts User model operations.
 * Wired to Deepika's Mongoose User model at integration time.
 */
export interface UserRepository {
  /** Returns the matching document (without passwordHash), or null. */
  findOneByEmail(email: string): Promise<UserDocument | null>;

  /** Returns the matching document by phone number, or null. */
  findOneByPhone?(phone: string): Promise<UserDocument | null>;

  /**
   * Returns the matching document INCLUDING passwordHash, or null.
   * Required for login credential verification.
   */
  findOneByEmailWithPassword(email: string): Promise<UserDocument | null>;

  /** Finds a user by ID. */
  findById?(id: string): Promise<UserDocument | null>;

  /** Persists a new user and returns the created document. */
  createUser(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<UserDocument>;
}

// ─── Custom Auth Error ────────────────────────────────────────────────────────

/**
 * Thrown for predictable authentication failures (validation, duplicates, bad credentials).
 * Controllers catch this and return appropriate HTTP 400/401/409 responses
 * without exposing database internals or stack traces.
 */
export class AuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a persisted user document to safe, outward-facing data.
 * passwordHash is never included in the return value.
 */
export const toSafeUser = (user: UserDocument): SafeUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage ?? null,
});

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Registers a new BankEase user.
 *
 * Steps:
 *  1. Validate that name, email, phone, and password are all present.
 *  2. Validate email format.
 *  3. Normalise email (lowercase + trim) and phone.
 *  4. Check for existing account by email via UserRepository.
 *  5. Check for existing account by phone if supported.
 *  6. Hash the password with bcrypt — plain text is discarded immediately.
 *  7. Persist the new user via UserRepository.
 *  8. Generate signed JWT token with { sub: user.id }.
 *  9. Return safe user fields and token.
 */
export const registerUser = async (
  input: RegisterInput,
  userRepo: UserRepository
): Promise<AuthResult> => {
  const { name, password, phone } = input;

  // ── 1. Validate required fields ──────────────────────────────────────────
  if (!name || name.trim() === '') {
    throw new AuthError('Name is required', 400);
  }
  if (!input.email || input.email.trim() === '') {
    throw new AuthError('Email is required', 400);
  }
  if (!phone || phone.trim() === '') {
    throw new AuthError('Phone number is required', 400);
  }
  if (!password || password.trim() === '') {
    throw new AuthError('Password is required', 400);
  }

  // ── 2. Format validation ─────────────────────────────────────────────────
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new AuthError('Please provide a valid email address', 400);
  }

  const trimmedPhone = phone.trim();

  // ── 3. Duplicate checks via repository ───────────────────────────────────
  const existingEmail = await userRepo.findOneByEmail(email);
  if (existingEmail) {
    throw new AuthError('Email already registered', 409);
  }

  if (userRepo.findOneByPhone) {
    const existingPhone = await userRepo.findOneByPhone(trimmedPhone);
    if (existingPhone) {
      throw new AuthError('Phone number already registered', 409);
    }
  }

  // ── 4. Hash the password — plain text is never stored ────────────────────
  const passwordHash = await hashPassword(password);

  // ── 5. Persist via repository ────────────────────────────────────────────
  const user = await userRepo.createUser({
    name: name.trim(),
    email,
    phone: trimmedPhone,
    passwordHash,
  });

  const safeUser = toSafeUser(user);
  const token = generateAccessToken(safeUser.id);

  // ── 6. Return safe user and token ─────────────────────────────────────────
  return {
    user: safeUser,
    token,
  };
};

/**
 * Authenticates an existing BankEase user.
 *
 * Steps:
 *  1. Validate that email and password are present.
 *  2. Normalise email (lowercase + trim).
 *  3. Look up the user including passwordHash via UserRepository.
 *  4. If not found, throw generic error — do NOT reveal whether email exists.
 *  5. Compare the supplied password against stored hash using bcrypt.
 *  6. If mismatch, throw the same generic error.
 *  7. Generate signed JWT access token with { sub: user.id }.
 *  8. Return safe user fields and token.
 */
export const loginUser = async (
  input: LoginInput,
  userRepo: UserRepository
): Promise<AuthResult> => {
  // ── 1. Validate required fields ──────────────────────────────────────────
  if (!input.email || input.email.trim() === '') {
    throw new AuthError('Email is required', 400);
  }
  if (!input.password || input.password.trim() === '') {
    throw new AuthError('Password is required', 400);
  }

  // ── 2. Normalise email ───────────────────────────────────────────────────
  const email = input.email.trim().toLowerCase();

  // ── 3. Fetch user with passwordHash via repository ───────────────────────
  const user = await userRepo.findOneByEmailWithPassword(email);

  // ── 4. User not found — generic error prevents email enumeration ─────────
  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  // ── 5. Compare supplied password against stored hash ─────────────────────
  const isMatch = await comparePassword(input.password, user.passwordHash);

  // ── 6. Wrong password — identical generic error ───────────────────────────
  if (!isMatch) {
    throw new AuthError('Invalid email or password', 401);
  }

  const safeUser = toSafeUser(user);
  const token = generateAccessToken(safeUser.id);

  // ── 7. Return safe user and token ─────────────────────────────────────────
  return {
    user: safeUser,
    token,
  };
};
