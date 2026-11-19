"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useStoredValue } from "./use-stored-value";
import { wazooStorage } from "./wazoo-storage";

export const consentStorageKey = "consent";
export type ConsentStatus = "accepted" | "rejected" | null;

/**
 * Read the persisted consent choice without a React component. Any future
 * non-essential script (analytics, marketing, third-party embeds) MUST check
 * this before loading: only `accepted` may load.
 */
export function readConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;

  try {
    const value = wazooStorage.get(consentStorageKey);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch (err) {
    console.error("Could not read saved consent", err);
    return null;
  }
}

interface ConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const stored = useStoredValue(consentStorageKey);
  // The choice made in this session, which holds even when storage rejects the write.
  const [chosen, setChosen] = useState<ConsentStatus>(null);
  const status: ConsentStatus =
    chosen ?? (stored === "accepted" || stored === "rejected" ? stored : null);

  const persist = useCallback((value: "accepted" | "rejected") => {
    try {
      wazooStorage.set(consentStorageKey, value);
    } catch (err) {
      console.error("Could not persist consent", err);
      // Storage can be unavailable (private mode, quota); consent still applies for this session.
    }
    setChosen(value);
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
