"use client";

import { useState } from "react";
import { thrownMessage } from "@/lib/utils";
import { fetchSubjectQuads, postSearch } from "./search-api";
import {
  filterResults,
  getTypeOptions,
  type DetailQuad,
  type SearchResult,
} from "./search-types";

export function useWorldSearch(worldId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [minScore, setMinScore] = useState(0.0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [mode, setMode] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [propFilter, setPropFilter] = useState("");
  const [detailSubject, setDetailSubject] = useState<string | null>(null);
  const [detailQuads, setDetailQuads] = useState<DetailQuad[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setMode(null);

    try {
      const data = await postSearch(worldId, token, {
        query: query.trim(),
        limit,
        minScore,
      });
      setResults(data.results || []);
      // mode is required by the contract — surface the mode that actually ran
      // (semantic / keyword / hybrid / fallback) instead of implying semantic.
      setMode(data.mode);
      setDetailSubject(null);
      setDetailQuads([]);
    } catch (err) {
      setError(
        thrownMessage(err) || "An unexpected error occurred during search",
      );
    } finally {
      setLoading(false);
    }
  }

  function closeDetail() {
    setDetailSubject(null);
    setDetailQuads([]);
  }

  async function openDetail(subject: string) {
    if (detailSubject === subject) {
      closeDetail();
      return;
    }
    setDetailSubject(subject);
    setDetailLoading(true);
    setDetailError(null);
    setDetailQuads([]);
    try {
      setDetailQuads(await fetchSubjectQuads(worldId, token, subject));
    } catch (err) {
      setDetailError(thrownMessage(err) || "Failed to load subject detail");
    } finally {
      setDetailLoading(false);
    }
  }

  return {
    setToken,
    query,
    setQuery,
    limit,
    setLimit,
    minScore,
    setMinScore,
    showFilters,
    setShowFilters,
    loading,
    error,
    results,
    mode,
    typeFilter,
    setTypeFilter,
    labelFilter,
    setLabelFilter,
    propFilter,
    setPropFilter,
    detailSubject,
    detailQuads,
    detailLoading,
    detailError,
    handleSearch,
    openDetail,
    closeDetail,
    typeOptions: getTypeOptions(results),
    filteredResults: filterResults(
      results,
      typeFilter,
      propFilter,
      labelFilter,
    ),
  };
}
