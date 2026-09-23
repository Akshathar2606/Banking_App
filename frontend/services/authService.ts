import { API_BASE_URL } from '../constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Matches the user object returned by POST /api/auth/login and /api/auth/register */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Matches the successful JSON response from POST /api/auth/login */
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Authenticate a user against the BankEase backend.
 *
 * @param email    - The user's email address
 * @param password - The user's plain-text password (sent over HTTPS only; never stored here)
 * @returns        The typed LoginResponse including the JWT and user object
 * @throws         Error with the backend's message on non-2xx responses
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Use the backend's message field when available, fall back to HTTP status
    throw new Error(data?.message ?? `Login failed (HTTP ${response.status})`);
  }

  return data as LoginResponse;
};

/** Matches the successful JSON response from POST /api/auth/register */
export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

/**
 * Register a new user account.
 *
 * @param name     - Full name
 * @param email    - Must be unique across all users
 * @param phone    - Must be unique across all users
 * @param password - Plain-text password (hashed server-side; never stored here)
 * @returns        The typed RegisterResponse including the JWT and new user object
 * @throws         Error with the backend's message on non-2xx responses
 */
export const register = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, phone, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Registration failed (HTTP ${response.status})`);
  }

  return data as RegisterResponse;
};
