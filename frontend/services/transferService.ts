import { API_BASE_URL } from '../constants/api';
import { Transaction } from './transactionService';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Request body sent to POST /api/transactions/transfer */
export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

/** Successful response from POST /api/transactions/transfer (HTTP 201) */
export interface TransferResponse {
  success: boolean;
  message: string;
  transaction: Transaction;
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Transfer funds between two accounts.
 *
 * The source account must belong to the authenticated user.
 * The recipient account may belong to any user.
 * The transfer is executed atomically on the backend (MongoDB session).
 *
 * @param token              - JWT from AuthContext
 * @param sourceAccountId    - MongoDB _id of the account to debit
 * @param recipientAccountId - MongoDB _id of the account to credit
 * @param amount             - Positive number greater than 0
 * @param description        - Optional memo (shown in transaction history)
 * @returns                  The created Transaction record
 * @throws                   Error with the backend's message on non-2xx responses
 */
export const transferFunds = async (
  token: string,
  sourceAccountId: string,
  recipientAccountId: string,
  amount: number,
  description?: string
): Promise<TransferResponse> => {
  const body: TransferRequest = {
    fromAccountId: sourceAccountId,
    toAccountId:   recipientAccountId,
    amount,
    ...(description ? { description } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
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
      data?.message ?? `Transfer failed (HTTP ${response.status})`
    );
  }

  return data as TransferResponse;
};
