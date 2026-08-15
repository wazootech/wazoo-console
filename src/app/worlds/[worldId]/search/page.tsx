"use client";

import { useState, use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorCard } from "@/components/error-card";
import { getWorldTabs, getWorldsApiUrl } from "@/lib/utils";
import {
  Search,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

interface SearchResult {
  subject: string;
  predicate: string;
  object?: string; // from fallback SQL LIKE
  content?: string; // from semantic search text
  score?: number; // from semantic search
  graph?: string;
}

export default function SearchPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);

  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(10);
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
  const [detailQuads, setDetailQuads] = useState<SearchResult[]>([]);
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
      const endpoint = `${getWorldsApiUrl()}/worlds/${worldId}/search`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          topK,
          minScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to search World Graph");
      }

      setResults(data.results || []);
      setMode(data.mode || "semantic");
      setDetailSubject(null);
      setDetailQuads([]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during search");
    } finally {
      setLoading(false);
    }
  }

  // Derived type options from rdf:type triples found in the current results.
  const typeOptions = Array.from(
    new Set(
      results
        .filter((r) => r.predicate.includes("#type"))
        .map((r) => r.object || r.content)
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();

  // Client-side filtering over the fetched results.
  const filteredResults = results.filter((r) => {
    if (typeFilter) {
      const typedSubjects = new Set(
        results
          .filter(
            (t) =>
              t.predicate.includes("#type") &&
              (t.object || t.content) === typeFilter,
          )
          .map((t) => t.subject),
      );
      if (!typedSubjects.has(r.subject)) return false;
    }
    if (
      propFilter &&
      !r.predicate.toLowerCase().includes(propFilter.toLowerCase())
    ) {
      return false;
    }
    if (
      labelFilter &&
      !(r.content || r.object || "")
        .toLowerCase()
        .includes(labelFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  async function openDetail(subject: string) {
    if (detailSubject === subject) {
      setDetailSubject(null);
      setDetailQuads([]);
      return;
    }
    setDetailSubject(subject);
    setDetailLoading(true);
    setDetailError(null);
    setDetailQuads([]);
    try {
      const endpoint = `${getWorldsApiUrl()}/worlds/${worldId}/sparql`;
      const escaped = subject.replace(/[\\"]/g, (m) =>
        m === '"' ? '\\"' : "\\\\",
      );
      const query = `SELECT ?p ?o ?g WHERE { GRAPH ?g { <${escaped}> ?p ?o } }`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to load subject detail");
      }
      const bindings: any[] = data?.results?.bindings || [];
      setDetailQuads(
        bindings.map((b) => ({
          subject,
          predicate: b.p?.value || "",
          object: b.o?.value || "",
          graph: b.g?.value || "",
        })),
      );
    } catch (err: any) {
      setDetailError(err.message || "Failed to load subject detail");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Vector & Hybrid Search"
          description="Semantically search and query nodes in your World Graph using embeddings"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={setToken} />

        <div className="space-y-4">
          <Card className="border border-zinc-800 bg-zinc-950 text-white">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                      placeholder="e.g. Find references to agent status, memory history, or profile definitions..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white pl-9 h-11 text-sm focus:border-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-zinc-800 hover:bg-zinc-900 h-11"
                  >
                    <SlidersHorizontal className="size-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-6 font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                    <div className="space-y-1.5">
                      <Label htmlFor="top-k" className="text-zinc-400 text-xs">
                        Limit (Top K)
                      </Label>
                      <Input
                        id="top-k"
                        type="number"
                        min={1}
                        max={100}
                        value={topK}
                        onChange={(e) =>
                          setTopK(parseInt(e.target.value) || 10)
                        }
                        className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="min-score"
                        className="text-zinc-400 text-xs"
                      >
                        Min Similarity Score
                      </Label>
                      <Input
                        id="min-score"
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={minScore}
                        onChange={(e) =>
                          setMinScore(parseFloat(e.target.value) || 0)
                        }
                        className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="type-filter"
                        className="text-zinc-400 text-xs"
                      >
                        Type (rdf:type)
                      </Label>
                      <select
                        id="type-filter"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 text-white text-xs px-2"
                      >
                        <option value="">All types</option>
                        {typeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="prop-filter"
                        className="text-zinc-400 text-xs"
                      >
                        Property (predicate contains)
                      </Label>
                      <Input
                        id="prop-filter"
                        type="text"
                        placeholder="e.g. #label"
                        value={propFilter}
                        onChange={(e) => setPropFilter(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="label-filter"
                        className="text-zinc-400 text-xs"
                      >
                        Label / object contains
                      </Label>
                      <Input
                        id="label-filter"
                        type="text"
                        placeholder="e.g. agent"
                        value={labelFilter}
                        onChange={(e) => setLabelFilter(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Results display */}
          <Card className="border border-zinc-800 bg-zinc-950 text-white min-h-[250px]">
            <CardHeader className="border-b border-zinc-900 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" /> Query Results
              </CardTitle>
              {mode === "fallback" && (
                <div className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-950/20 border border-amber-900/50 px-2 py-0.5 rounded">
                  <AlertTriangle className="size-3 shrink-0" />
                  Fallback Mode (SQL LIKE)
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {error && <ErrorCard message={error} />}

              {!error && results.length === 0 && !loading && (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Enter a search query to search semantic nodes.
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-zinc-400 text-xs">
                    Performing vector similarity search...
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-3">
                  {filteredResults.length === 0 && (
                    <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded">
                      No results match the active filters.
                    </div>
                  )}
                  {filteredResults.length > 0 && (
                    <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-900/30">
                      <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-medium">
                            <th className="p-3 w-8" />
                            <th className="p-3 border-r border-zinc-800">
                              Subject
                            </th>
                            <th className="p-3 border-r border-zinc-800">
                              Predicate
                            </th>
                            <th className="p-3 border-r border-zinc-800">
                              Content / Object
                            </th>
                            {mode !== "fallback" && (
                              <th className="p-3 border-r border-zinc-800">
                                Score
                              </th>
                            )}
                            <th className="p-3">Graph</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.map((r, idx) => (
                            <tr
                              key={idx}
                              className={`border-b border-zinc-800 last:border-b-0 ${
                                detailSubject === r.subject
                                  ? "bg-primary/5"
                                  : "hover:bg-zinc-900/10"
                              }`}
                            >
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => openDetail(r.subject)}
                                  aria-expanded={detailSubject === r.subject}
                                  aria-label={`Inspect ${r.subject}`}
                                  className="text-zinc-500 hover:text-primary transition-colors"
                                >
                                  {detailSubject === r.subject ? (
                                    <ChevronDown className="size-4" />
                                  ) : (
                                    <ChevronRight className="size-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                                {r.subject}
                              </td>
                              <td className="p-3 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                                {r.predicate}
                              </td>
                              <td className="p-3 border-r border-zinc-800 break-words text-zinc-200">
                                {r.content || r.object || "—"}
                              </td>
                              {mode !== "fallback" && (
                                <td className="p-3 border-r border-zinc-800 font-semibold text-primary">
                                  {r.score !== undefined
                                    ? r.score.toFixed(4)
                                    : "—"}
                                </td>
                              )}
                              <td className="p-3 font-mono break-all max-w-[100px]">
                                {r.graph || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detailSubject && (
                    <div className="border border-zinc-800 rounded-lg bg-zinc-900/40">
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200">
                            Subject detail
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500 break-all">
                            {detailSubject}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailSubject(null);
                            setDetailQuads([]);
                          }}
                          aria-label="Close detail panel"
                          className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        {detailLoading && (
                          <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <Loader2 className="size-4 animate-spin" />
                            Loading all quads for subject...
                          </div>
                        )}
                        {detailError && <ErrorCard message={detailError} />}
                        {!detailLoading &&
                          !detailError &&
                          detailQuads.length === 0 && (
                            <p className="text-zinc-500 text-xs">
                              No quads found for this subject.
                            </p>
                          )}
                        {!detailLoading && detailQuads.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                              <thead>
                                <tr className="text-zinc-400 font-medium border-b border-zinc-800">
                                  <th className="py-2 pr-3">Predicate</th>
                                  <th className="py-2 pr-3">Object</th>
                                  <th className="py-2">Graph</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailQuads.map((q, i) => (
                                  <tr
                                    key={i}
                                    className="border-b border-zinc-900 last:border-b-0"
                                  >
                                    <td className="py-2 pr-3 font-mono break-all max-w-[160px]">
                                      {q.predicate}
                                    </td>
                                    <td className="py-2 pr-3 break-words text-zinc-200">
                                      {q.object}
                                    </td>
                                    <td className="py-2 font-mono break-all max-w-[120px]">
                                      {q.graph || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
