"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient, type Client, type User } from "@wazoo/client";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && (window as any).__WZ_API_URL) {
    return (window as any).__WZ_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "https://api.wazoo.dev";
}

interface AuthState {
  token: string | null;
  user: User | null;
  client: Client | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type SessionResponse = {
  token: string;
  user: User;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    client: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const pathname = window.location.pathname.replace(/\/$/, "");
    const authPathnames = new Set(["/sign-in", "/callback"]);

    if (authPathnames.has(pathname)) {
      setState((currentState) => ({ ...currentState, loading: false }));
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Not signed in");
        }
        return (await response.json()) as SessionResponse;
      })
      .then(({ token, user }) => {
        if (cancelled) return;
        const client = createClient({
          auth: token,
          throwOnError: false,
          baseUrl: getApiBaseUrl() ?? "https://api.wazoo.dev",
        });
        setState({ token, user, client, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Could not load session.";
        setState({
          token: null,
          user: null,
          client: null,
          loading: false,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState({
      token: null,
      user: null,
      client: null,
      loading: false,
      error: null,
    });
    window.location.assign("/sign-out");
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
