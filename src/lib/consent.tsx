"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export const consentStorageKey = "wazoo_consent";

export type ConsentStatus = "accepted" | "rejected" | null;

/**
 * Read the persisted consent choice without a React component. Any future
 * non-essential script (analytics, marketing, third-party embeds) MUST check
 * this before loading: only `accepted` may load.
 */
export function readConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(consentStorageKey);
  return value === "accepted" || value === "rejected" ? value : null;
}

interface ConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>(() => readConsent());

  const persist = useCallback((value: "accepted" | "rejected") => {
    window.localStorage.setItem(consentStorageKey, value);
    setStatus(value);
  }, []);

  const accept = useCallback(() => persist("accepted"), [persist]);
  const reject = useCallback(() => persist("rejected"), [persist]);

  return (
    <ConsentContext.Provider value={{ status, accept, reject }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
