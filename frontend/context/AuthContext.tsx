import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { login as apiLogin, LoginResponse, User } from '../services/authService';
import { saveToken, getToken, removeToken } from '../utils/storage';

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in. */
  user: User | null;
  /** The stored JWT, or null if not logged in. */
  token: string | null;
  /** True while the stored token is being read on app launch. */
  isLoading: boolean;
  /**
   * Authenticate with the backend.
   * Saves the JWT and updates user/token in state.
   * Throws on failure — let the login screen surface the error.
   */
  login: (email: string, password: string) => Promise<LoginResponse>;
  /** Clear the stored JWT and reset all auth state. */
  logout: () => Promise<void>;
}

// ── Context creation ──────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initialise from secure storage on mount ──────────────────────────────
  useEffect(() => {
    const initialise = async () => {
      try {
        const stored = await getToken();
        if (stored) {
          // Token exists — keep it in state so protected screens stay accessible.
          // No /me endpoint exists yet; user profile will be set after next login.
          setToken(stored);
        }
      } catch {
        // Secure storage unavailable (e.g. first run on a new device) — stay logged out.
      } finally {
        setIsLoading(false);
      }
    };

    initialise();
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await apiLogin(email, password);

    await saveToken(response.token);

    setToken(response.token);
    setUser(response.user);

    return response;
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the authentication context.
 * Must be called inside a component that is wrapped by AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }
  return ctx;
}
