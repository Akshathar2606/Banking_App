import { API_BASE_URL } from '../constants/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardType   = 'debit' | 'credit';
export type CardStatus = 'active' | 'blocked' | 'expired';

/**
 * Matches the card object returned by the backend.
 * Note: cardNumber is always masked server-side: "**** **** **** XXXX"
 */
export interface Card {
  _id: string;
  userId: string;
  cardType: CardType;
  /** Always masked by the backend — only last 4 digits are visible */
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  createdAt: string;
}

/** Response envelope for GET /api/cards */
export interface GetCardsResponse {
  success: boolean;
  message: string;
  cards: Card[];
}

/** Response envelope for GET /api/cards/:id */
export interface GetCardResponse {
  success: boolean;
  message: string;
  card: Card;
}

/** Response envelope for PATCH /api/cards/:id/block and /api/cards/:id/unblock */
export interface UpdateCardStatusResponse {
  success: boolean;
  message: string;
  card: Card;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch all cards for the authenticated user.
 * Card numbers are masked by the backend — only the last 4 digits are returned.
 *
 * @param token - JWT from AuthContext
 * @returns     Array of the user's cards
 * @throws      Error with the backend's message on non-2xx responses
 */
export const getCards = async (token: string): Promise<Card[]> => {
  const response = await fetch(`${API_BASE_URL}/cards`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch cards (HTTP ${response.status})`);
  }

  return (data as GetCardsResponse).cards;
};

/**
 * Fetch a single card by ID (must belong to the authenticated user).
 *
 * @param token  - JWT from AuthContext
 * @param cardId - MongoDB _id of the card
 * @returns      The card document
 * @throws       Error with the backend's message on non-2xx responses
 */
export const getCard = async (token: string, cardId: string): Promise<Card> => {
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to fetch card (HTTP ${response.status})`);
  }

  return (data as GetCardResponse).card;
};

/**
 * Block or unblock a card.
 *
 * Maps to the backend routes:
 *   PATCH /api/cards/:id/block   — sets status to "blocked"
 *   PATCH /api/cards/:id/unblock — sets status to "active"
 *
 * Neither endpoint requires a request body; the action is encoded in the URL.
 * Expired cards cannot be blocked or unblocked (backend returns 400).
 *
 * @param token  - JWT from AuthContext
 * @param cardId - MongoDB _id of the card
 * @param action - "block" to disable the card, "unblock" to re-enable it
 * @returns      The updated card document
 * @throws       Error with the backend's message on non-2xx responses
 */
export const updateCardStatus = async (
  token: string,
  cardId: string,
  action: 'block' | 'unblock'
): Promise<Card> => {
  const response = await fetch(`${API_BASE_URL}/cards/${cardId}/${action}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Failed to ${action} card (HTTP ${response.status})`);
  }

  return (data as UpdateCardStatusResponse).card;
};
