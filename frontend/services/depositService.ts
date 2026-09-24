import { API_BASE_URL } from '../constants/api';
import { Transaction } from './transactionService';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Successful response from POST /api/accounts/:id/deposit (HTTP 201) */
export interface DepositResponse {
  success: boolean;
  message: string;
  transaction: Transaction;
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Add money to the authenticated user's account (simulated demo deposit).
 *
 * Maps to: POST /api/accounts/:id/deposit
 *
 * The backend enforces:
 * - Account must belong to the authenticated user (403 otherwise)
 * - Amount must be a number greater than 0 (400 otherwise)
 * - Account must be active (400 otherwise)
 * - Balance update and transaction creation are executed atomically
 *
 * @param token       - JWT from AuthContext
 * @param accountId   - MongoDB _id of the account to credit
 * @param amount      - Positive number to add to the balance
 * @param description - Optional memo (defaults to "Money added" on the backend)
 * @returns           The created deposit Transaction record
 * @throws            Error with the backend's message on non-2xx responses
 */
export const depositFunds = async (
  token: string,
  accountId: string,
  amount: number,
  description?: string
): Promise<DepositResponse> => {
  const body: { amount: number; description?: string } = {
    amount,
    ...(description ? { description } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ?? `Deposit failed (HTTP ${response.status})`
    );
  }

  return data as DepositResponse;
};
