const prefix = "wazoo_";

const listeners = new Set<() => void>();

/**
 * A wrapper around localStorage getter and setter that embeds a specific prefix (i.e. wazoo_) to keys.
 * Writes notify `subscribe` listeners, so components can read stored values with `useStoredValue`
 * instead of copying them into state from an effect.
 */
export const wazooStorage = {
  get(key: string): string | null {
    return window.localStorage.getItem(prefix + key);
  },
  set(key: string, value: string): void {
    window.localStorage.setItem(prefix + key, value);
    for (const listener of listeners) listener();
  },
  /** subscribe calls `listener` after any write here or in another tab; it returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
};
