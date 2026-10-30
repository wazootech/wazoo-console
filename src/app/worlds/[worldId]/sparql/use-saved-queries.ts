"use client";

import { useState, useEffect } from "react";

export function useSavedQueries(worldId: string, query: string) {
  const [customQueries, setCustomQueries] = useState<
    Array<{ name: string; query: string }>
  >([]);
  const [newQueryName, setNewQueryName] = useState("");

  // Load custom queries from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`wazoo_sparql_queries_${worldId}`);
      if (saved) setCustomQueries(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, [worldId]);

  function saveQuery() {
    if (!newQueryName.trim() || !query.trim()) return;
    const updated = [...customQueries, { name: newQueryName.trim(), query }];
    setCustomQueries(updated);
    localStorage.setItem(
      `wazoo_sparql_queries_${worldId}`,
      JSON.stringify(updated),
    );
    setNewQueryName("");
  }

  function deleteQuery(index: number) {
    const updated = customQueries.filter((_, i) => i !== index);
    setCustomQueries(updated);
    localStorage.setItem(
      `wazoo_sparql_queries_${worldId}`,
      JSON.stringify(updated),
    );
  }

  return {
    customQueries,
    newQueryName,
    setNewQueryName,
    saveQuery,
    deleteQuery,
  };
}
