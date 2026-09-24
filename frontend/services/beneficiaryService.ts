import { API_BASE_URL } from '../constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Matches the beneficiary document returned by the backend */
export interface Beneficiary {
  _id: string;
  userId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  /** Optional label the user gives this beneficiary e.g. "Mom", "Landlord" */
  nickname: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields accepted by POST /api/beneficiaries */
export interface CreateBeneficiaryData {
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  nickname?: string;
}

/**
 * Fields accepted by PATCH /api/beneficiaries/:id
 * accountNumber is intentionally excluded — it is immutable on the backend.
 */
export interface UpdateBeneficiaryData {
  name?: string;
  bankName?: string;
  ifscCode?: string;
  nickname?: string;
  isActive?: boolean;
}

// Response envelopes
interface GetBeneficiariesResponse {
  success: boolean;
  message: string;
  beneficiaries: Beneficiary[];
}

interface GetBeneficiaryResponse {
  success: boolean;
  message: string;
  beneficiary: Beneficiary;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch all beneficiaries for the authenticated user, sorted newest first.
 *
 * @param token - JWT from AuthContext
 * @returns     Array of the user's saved beneficiaries
 * @throws      Error with the backend's message on non-2xx responses
 */
export const getBeneficiaries = async (token: string): Promise<Beneficiary[]> => {
  const response = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch beneficiaries (HTTP ${response.status})`);
  }

  return (data as GetBeneficiariesResponse).beneficiaries;
};

/**
 * Fetch a single beneficiary by ID (must belong to the authenticated user).
 *
 * @param token           - JWT from AuthContext
 * @param beneficiaryId   - MongoDB _id of the beneficiary
 * @returns               The beneficiary document
 * @throws                Error with the backend's message on non-2xx responses
 */
export const getBeneficiary = async (
  token: string,
  beneficiaryId: string
): Promise<Beneficiary> => {
  const response = await fetch(`${API_BASE_URL}/beneficiaries/${beneficiaryId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch beneficiary (HTTP ${response.status})`);
  }

  return (data as GetBeneficiaryResponse).beneficiary;
};

/**
 * Save a new beneficiary for the authenticated user.
 * userId is always set server-side from the JWT — never sent from the client.
 *
 * @param token  - JWT from AuthContext
 * @param fields - Required and optional beneficiary fields
 * @returns      The created beneficiary document
 * @throws       Error with the backend's message on non-2xx (incl. 409 duplicate)
 */
export const createBeneficiary = async (
  token: string,
  fields: CreateBeneficiaryData
): Promise<Beneficiary> => {
  const response = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(fields),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to add beneficiary (HTTP ${response.status})`);
  }

  return (data as GetBeneficiaryResponse).beneficiary;
};

/**
 * Update allowed fields of a beneficiary.
 * accountNumber cannot be changed and is not accepted by this function.
 *
 * @param token         - JWT from AuthContext
 * @param beneficiaryId - MongoDB _id of the beneficiary
 * @param updates       - Partial fields to update
 * @returns             The updated beneficiary document
 * @throws              Error with the backend's message on non-2xx responses
 */
export const updateBeneficiary = async (
  token: string,
  beneficiaryId: string,
  updates: UpdateBeneficiaryData
): Promise<Beneficiary> => {
  const response = await fetch(`${API_BASE_URL}/beneficiaries/${beneficiaryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to update beneficiary (HTTP ${response.status})`);
  }

  return (data as GetBeneficiaryResponse).beneficiary;
};

/**
 * Permanently delete a beneficiary.
 *
 * @param token         - JWT from AuthContext
 * @param beneficiaryId - MongoDB _id of the beneficiary to delete
 * @throws              Error with the backend's message on non-2xx responses
 */
export const deleteBeneficiary = async (
  token: string,
  beneficiaryId: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/beneficiaries/${beneficiaryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message ?? `Failed to delete beneficiary (HTTP ${response.status})`);
  }
};
