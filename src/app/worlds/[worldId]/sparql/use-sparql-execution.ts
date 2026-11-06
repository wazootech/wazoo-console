"use client";

import { useState } from "react";
import { isUnrecognizedWorldTokenError } from "@/lib/world-token-errors";
import { getWorldsApiUrl, thrownMessage } from "@/lib/utils";
import type { SparqlResponse } from "./sparql-presets";

export function useSparqlExecution(
  worldId: string,
  token: string | null,
  query: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidTokenError, setInvalidTokenError] = useState(false);
  const [result, setResult] = useState<SparqlResponse | null>(null);
  const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);

  async function executeQuery() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    setLoading(true);
    setError(null);
    setInvalidTokenError(false);
    setResult(null);
    setTimeTakenMs(null);

    const startTime = performance.now();
    try {
      const endpoint = `${getWorldsApiUrl()}/worlds/${encodeURIComponent(worldId)}/sparql`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      const responseText = await res.text();
      let data: SparqlResponse | null = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      const message =
        data?.error?.message ||
        responseText.trim() ||
        "Failed to execute query";
      if (!res.ok) {
        if (
          isUnrecognizedWorldTokenError(res.status, message, data?.error?.code)
        ) {
          setInvalidTokenError(true);
          return;
        }
        throw new Error(message);
      }

      setResult(data);
    } catch (e) {
      setInvalidTokenError(false);
      setError(thrownMessage(e) || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setTimeTakenMs(Math.round(performance.now() - startTime));
    }
  }

  return {
    loading,
    error,
    invalidTokenError,
    result,
    timeTakenMs,
    executeQuery,
  };
}
