import { API_BASE_URL } from '../constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Matches the account document returned by GET /api/accounts */
export interface Account {
  _id: string;
  userId: string;
  accountNumber: string;
  accountType: 'savings' | 'current';
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/** Matches the successful JSON response from GET /api/accounts */
export interface GetAccountsResponse {
  success: boolean;
  accounts: Account[];
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Fetch all accounts belonging to the authenticated user.
 *
 * @param token - The JWT from AuthContext
 * @returns     Array of the user's accounts
 * @throws      Error with the backend's message on non-2xx responses
 */
export const getAccounts = async (token: string): Promise<Account[]> => {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch accounts (HTTP ${response.status})`);
  }

  return (data as GetAccountsResponse).accounts;
};
