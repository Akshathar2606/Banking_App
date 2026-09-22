import { API_BASE_URL } from '../constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Transaction type values supported by the backend schema */
export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'bill_payment';

/** Transaction status values supported by the backend schema */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/** Matches the transaction document returned by GET /api/transactions */
export interface Transaction {
  _id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  /** Only populated for transfers; null for deposits/withdrawals/bill_payment */
  recipientId: string | null;
  recipientName: string | null;
  description: string | null;
  status: TransactionStatus;
  /** Unique reference ID (e.g. "TXN-MUALCPQ0-B4S6ER") */
  reference: string;
  /** Explicit transaction date — separate from createdAt */
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Matches the successful JSON response from GET /api/transactions */
export interface GetTransactionsResponse {
  success: boolean;
  transactions: Transaction[];
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Fetch all transactions for the authenticated user, sorted newest first.
 *
 * @param token - The JWT from AuthContext
 * @returns     Array of the user's transactions (newest first)
 * @throws      Error with the backend's message on non-2xx responses
 */
export const getTransactions = async (token: string): Promise<Transaction[]> => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ?? `Failed to fetch transactions (HTTP ${response.status})`
    );
  }

  return (data as GetTransactionsResponse).transactions;
};
