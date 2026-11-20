"use client";

import { useSyncExternalStore } from "react";
import { wazooStorage } from "./wazoo-storage";

/** The raw value on the server and during hydration, before storage can be read. */
const serverSnapshot = () => null;

function readStored(key: string): string | null {
  try {
    return wazooStorage.get(key);
  } catch {
    // Storage can be unavailable (private mode); treat it as empty.
    return null;
  }
}

/**
 * useStoredValue returns the raw string saved under `key` (see wazoo-storage.ts),
 * or null when it is unset or storage is unavailable. It updates when the value
 * is written, so callers derive state from it instead of syncing it in an effect.
 */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    wazooStorage.subscribe,
    () => readStored(key),
    serverSnapshot,
  );
}
