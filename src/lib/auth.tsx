"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createClient, type Client, type User } from "@wazoo/client";
import { useAsyncData } from "./use-async-data";

function getApiBaseUrl(serverResolved?: string): string {
  if (serverResolved) return serverResolved;
  const injected =
    typeof window !== "undefined"
      ? (window as Window & { __WZ_API_URL?: string }).__WZ_API_URL
      : undefined;
  if (injected) return injected;
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

const authPathnames = new Set(["/sign-in", "/callback"]);

type SessionResult =
  { session: SessionResponse; error: null } | { session: null; error: string };

async function loadSession(): Promise<SessionResult> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Not signed in");
    }
    return { session: (await response.json()) as SessionResponse, error: null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not load session.";
    return { session: null, error: message };
  }
}

export function AuthProvider({
  children,
  apiUrl,
}: {
  children: ReactNode;
  /** Server-resolved API URL (preview builds only); else the build-time one. */
  apiUrl?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/$/, "");
  const onAuthPage = authPathnames.has(pathname);
  const [loggedOut, setLoggedOut] = useState(false);
  const { data: result } = useAsyncData(onAuthPage ? null : loadSession);

  const token = loggedOut ? null : (result?.session?.token ?? null);
  const client = useMemo(
    () =>
      token
        ? createClient({
            auth: token,
            throwOnError: false,
            baseUrl: getApiBaseUrl(apiUrl),
          })
        : null,
    [token, apiUrl],
  );
  const state: AuthState = {
    token,
    user: loggedOut ? null : (result?.session?.user ?? null),
    client,
    loading: !onAuthPage && !loggedOut && result === undefined,
    error: loggedOut ? null : (result?.error ?? null),
  };

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setLoggedOut(true);
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
