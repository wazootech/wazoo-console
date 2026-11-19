"use client";

import { useMemo, useState } from "react";
import { useStoredValue } from "@/lib/use-stored-value";
import { wazooStorage } from "@/lib/wazoo-storage";

type SavedQuery = { name: string; query: string };

function parseSavedQueries(saved: string | null): SavedQuery[] {
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (err) {
    console.error("Could not load saved SPARQL queries", err);
    return [];
  }
}

export function useSavedQueries(worldId: string, query: string) {
  const storageKey = `sparql_queries_${worldId}`;
  const [newQueryName, setNewQueryName] = useState("");
  const saved = useStoredValue(storageKey);
  const customQueries = useMemo(() => parseSavedQueries(saved), [saved]);

  function saveQuery() {
    if (!newQueryName.trim() || !query.trim()) return;
    const updated = [...customQueries, { name: newQueryName.trim(), query }];
    wazooStorage.set(storageKey, JSON.stringify(updated));
    setNewQueryName("");
  }

  function deleteQuery(index: number) {
    const updated = customQueries.filter((_, i) => i !== index);
    wazooStorage.set(storageKey, JSON.stringify(updated));
  }

  return {
    customQueries,
    newQueryName,
    setNewQueryName,
    saveQuery,
    deleteQuery,
  };
}
