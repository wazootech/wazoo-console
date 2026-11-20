"use client";

import { useEffect, useState } from "react";

interface Settled<T> {
  load: () => Promise<T>;
  run: number;
  data: T;
}

export interface AsyncData<T> {
  /** data is the latest settled result, or undefined until the first load finishes. */
  data: T | undefined;
  /** loading is true from the moment `load` or `reload` changes the request until it settles. */
  loading: boolean;
  /** reload runs `load` again; call it from event handlers. */
  reload: () => void;
}

/**
 * useAsyncData runs `load` whenever it changes (pass a memoized function) and on
 * `reload`. Loading is derived by comparing the settled request to the current
 * one, so the effect only sets state once the promise resolves, never
 * synchronously. A null `load` means there is nothing to fetch yet.
 */
export function useAsyncData<T>(load: (() => Promise<T>) | null): AsyncData<T> {
  const [run, setRun] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (!load) return;
    let stale = false;
    void load().then((data) => {
      if (!stale) setSettled({ load, run, data });
    });
    return () => {
      stale = true;
    };
  }, [load, run]);

  const loading =
    load !== null && (settled?.load !== load || settled.run !== run);
  return {
    data: settled?.data,
    loading,
    reload: () => setRun((n) => n + 1),
  };
}
