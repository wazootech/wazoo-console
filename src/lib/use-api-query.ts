"use client";

import { useMemo } from "react";
import type { Client } from "@wazoo/client";
import { useAuth } from "@/lib/auth";
import { isUnauthorizedError } from "@/lib/quota-error";
import { type AsyncData, useAsyncData } from "@/lib/use-async-data";

/** Never settles, so a page that is signing the user out keeps its spinner until the browser navigates. */
const neverSettles = <T>() => new Promise<T>(() => {});

function hasUnauthorizedError(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    result.error !== undefined &&
    isUnauthorizedError(result.error)
  );
}

interface ApiQueryOptions {
  /** signOutOnUnauthorized logs the user out when the call fails with an expired or invalid session. */
  signOutOnUnauthorized?: boolean;
}

/**
 * useApiQuery calls `call` with the signed-in client and re-runs it when `call`
 * changes (memoize it with useCallback) or on `reload`. While there is no client
 * yet, `loading` stays true.
 */
export function useApiQuery<T>(
  call: (client: Client) => Promise<T>,
  { signOutOnUnauthorized = false }: ApiQueryOptions = {},
): AsyncData<T> {
  const { client, logout } = useAuth();
  const load = useMemo(
    () =>
      client
        ? async () => {
            const result = await call(client);
            if (signOutOnUnauthorized && hasUnauthorizedError(result)) {
              logout();
              return neverSettles<T>();
            }
            return result;
          }
        : null,
    [client, call, logout, signOutOnUnauthorized],
  );
  const query = useAsyncData(load);
  return { ...query, loading: query.loading || client === null };
}
