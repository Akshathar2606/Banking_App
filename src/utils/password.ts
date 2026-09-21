import bcrypt from 'bcrypt';

/**
 * Number of salt rounds used by bcrypt.
 * 12 is a strong choice for a banking application —
 * high enough to be resistant to brute-force, low enough to stay responsive.
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password using bcrypt.
 *
 * @param password - The plain-text password submitted by the user.
 * @returns A bcrypt hash string to be stored in the database.
 *
 * @example
 * const hash = await hashPassword('mySecret123');
 * // store hash in user.passwordHash — NEVER store the plain-text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 *
 * @param password     - The plain-text password submitted during login.
 * @param passwordHash - The bcrypt hash retrieved from the database
 *                       (requires .select('+passwordHash') on the query).
 * @returns true if the password matches the hash, false otherwise.
 *
 * @example
 * const isMatch = await comparePassword('mySecret123', user.passwordHash);
 * if (!isMatch) throw new Error('Invalid credentials');
 */
export const comparePassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
