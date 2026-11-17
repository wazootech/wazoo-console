const prefix = "wazoo_";

/**
 * A wrapper around localStorage getter and setter that embeds a specific prefix (i.e. wazoo_) to keys.
 */
export const wazooStorage = {
  get(key: string): string | null {
    return window.localStorage.getItem(prefix + key);
  },
  set(key: string, value: string): void {
    window.localStorage.setItem(prefix + key, value);
  },
};
