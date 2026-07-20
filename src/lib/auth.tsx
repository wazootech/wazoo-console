"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  createWazooApiClient,
  getUserMe,
  type Client,
  type User,
} from "@wazoo/client";

interface AuthState {
  token: string | null;
  user: User | null;
  client: Client | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "wazoo_token";
const USER_KEY = "wazoo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    client: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const client = createWazooApiClient({
        auth: stored,
        throwOnError: false,
      });
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        try {
          setState({
            token: stored,
            user: JSON.parse(userJson),
            client,
            loading: false,
            error: null,
          });
          return;
        } catch {}
      }
      getUserMe({ client })
        .then((r) => {
          if (r.error) {
            logout();
          } else {
            const user = r.data?.user;
            if (user) {
              localStorage.setItem(USER_KEY, JSON.stringify(user));
              setState({
                token: stored,
                user,
                client,
                loading: false,
                error: null,
              });
            }
          }
        })
        .catch(() => logout());
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (token: string): Promise<string | null> => {
    const trimmed = token.trim();
    if (!trimmed.startsWith("wzp_")) return "Token must start with wzp_";
    const client = createWazooApiClient({ auth: trimmed, throwOnError: false });
    const r = await getUserMe({ client });
    if (r.error) {
      return typeof r.error === "object" && "error" in r.error
        ? (r.error as { error: { message: string } }).error.message
        : "Invalid token";
    }
    const user = r.data?.user;
    if (!user) return "Could not fetch user";
    localStorage.setItem(TOKEN_KEY, trimmed);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ token: trimmed, user, client, loading: false, error: null });
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({
      token: null,
      user: null,
      client: null,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
