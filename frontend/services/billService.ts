import { API_BASE_URL } from '../constants/api';
import { Transaction } from './transactionService';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BillType   = 'electricity' | 'water' | 'internet' | 'mobile' | 'other';
export type BillStatus = 'pending' | 'paid' | 'overdue';

/** Matches the bill document returned by GET /api/bills and GET /api/bills/:id */
export interface Bill {
  _id: string;
  userId: string;
  billerName: string;
  billType: BillType;
  consumerNumber: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  /** ISO date string when the bill was paid; null if not yet paid */
  paidAt: string | null;
  createdAt: string;
}

/** Response envelope for GET /api/bills */
export interface GetBillsResponse {
  success: boolean;
  message: string;
  bills: Bill[];
}

/** Response envelope for GET /api/bills/:id */
export interface GetBillResponse {
  success: boolean;
  message: string;
  bill: Bill;
}

/** Response envelope for POST /api/bills/:id/pay */
export interface PayBillResponse {
  success: boolean;
  message: string;
  /** The updated bill document (status === 'paid', paidAt populated) */
  bill: Bill;
  /** The created bill_payment transaction record */
  transaction: Transaction;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch all bills for the authenticated user.
 * Pending/overdue bills are sorted by dueDate ascending (most urgent first).
 *
 * @param token - JWT from AuthContext
 * @returns     Array of the user's bills
 * @throws      Error with the backend's message on non-2xx responses
 */
export const getBills = async (token: string): Promise<Bill[]> => {
  const response = await fetch(`${API_BASE_URL}/bills`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch bills (HTTP ${response.status})`);
  }

  return (data as GetBillsResponse).bills;
};

/**
 * Fetch a single bill by ID (must belong to the authenticated user).
 *
 * @param token  - JWT from AuthContext
 * @param billId - MongoDB _id of the bill
 * @returns      The bill document
 * @throws       Error with the backend's message on non-2xx responses
 */
export const getBill = async (token: string, billId: string): Promise<Bill> => {
  const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch bill (HTTP ${response.status})`);
  }

  return (data as GetBillResponse).bill;
};

/**
 * Pay a bill atomically.
 * The payment amount is always read from the bill — it cannot be overridden.
 *
 * @param token     - JWT from AuthContext
 * @param billId    - MongoDB _id of the bill to pay
 * @param accountId - MongoDB _id of the account to debit
 * @returns         The updated bill and the created bill_payment transaction
 * @throws          Error with the backend's message on non-2xx responses
 */
export const payBill = async (
  token: string,
  billId: string,
  accountId: string
): Promise<PayBillResponse> => {
  const response = await fetch(`${API_BASE_URL}/bills/${billId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ accountId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Bill payment failed (HTTP ${response.status})`);
  }

  return data as PayBillResponse;
};
