"use client";

import { useState, useEffect } from "react";
import { wazooStorage } from "@/lib/wazoo-storage";

export function useSavedQueries(worldId: string, query: string) {
  const storageKey = `sparql_queries_${worldId}`;
  const [customQueries, setCustomQueries] = useState<
    Array<{ name: string; query: string }>
  >([]);
  const [newQueryName, setNewQueryName] = useState("");

  // Load custom queries from local storage
  useEffect(() => {
    try {
      const saved = wazooStorage.get(storageKey);
      if (saved) setCustomQueries(JSON.parse(saved));
    } catch (err) {
      console.error("Could not load saved SPARQL queries", err);
    }
  }, [storageKey]);

  function saveQuery() {
    if (!newQueryName.trim() || !query.trim()) return;
    const updated = [...customQueries, { name: newQueryName.trim(), query }];
    setCustomQueries(updated);
    wazooStorage.set(storageKey, JSON.stringify(updated));
    setNewQueryName("");
  }

  function deleteQuery(index: number) {
    const updated = customQueries.filter((_, i) => i !== index);
    setCustomQueries(updated);
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
