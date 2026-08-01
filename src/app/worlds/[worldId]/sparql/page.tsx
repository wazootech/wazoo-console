"use client";

import { useState, use, useEffect } from "react";
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
import Editor from "@monaco-editor/react";
import { Play, Save, Trash2, Loader2, Sparkles } from "lucide-react";

const PRESET_QUERIES = [
  {
    name: "Insert sample triples",
    query: `PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA {
  ex:Agent1 rdf:type ex:Agent ;
            ex:status "Active" ;
            ex:name "Wazoo Bot" .
}`,
  },
  {
    name: "Select all triples",
    query: `SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
} LIMIT 100`,
  },
  {
    name: "Find type definitions",
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?subject ?type WHERE {
  ?subject rdf:type ?type .
} LIMIT 50`,
  },
  {
    name: "Ask check status",
    query: `PREFIX ex: <http://example.org/>

ASK WHERE {
  ?agent ex:status "Active" .
}`,
  },
  {
    name: "Delete sample triples",
    query: `PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

DELETE DATA {
  ex:Agent1 rdf:type ex:Agent ;
            ex:status "Active" ;
            ex:name "Wazoo Bot" .
}`,
  },
];

export default function SparqlPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);

  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState(PRESET_QUERIES[0].query);
  const [customQueries, setCustomQueries] = useState<
    Array<{ name: string; query: string }>
  >([]);
  const [newQueryName, setNewQueryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);

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

  async function executeQuery() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setTimeTakenMs(null);

    const startTime = performance.now();
    try {
      const endpoint = `${getWorldsApiUrl()}/worlds/${worldId}/sparql`;
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
        throw new Error(data.error?.message || "Failed to execute query");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setTimeTakenMs(Math.round(performance.now() - startTime));
    }
  }

  // Render bindings/select query output
  const renderResults = () => {
    if (!result) return null;

    // 1. Check if it's ask boolean
    if (typeof result === "boolean" || (result && "boolean" in result)) {
      const answer = typeof result === "boolean" ? result : result.boolean;
      return (
        <div className="p-4 border rounded bg-zinc-900 border-zinc-800 text-center">
          <p className="text-zinc-400 text-sm">ASK Response</p>
          <p className="text-2xl font-bold mt-1 text-white">
            {answer ? "TRUE" : "FALSE"}
          </p>
        </div>
      );
    }

    // 2. Check for mutation success response (INSERT/DELETE DATA)
    if (
      result.message ||
      result.ok ||
      result.success ||
      result.status === "ok"
    ) {
      const msg = result.message || "Graph update executed successfully.";
      return (
        <div className="p-4 border rounded bg-zinc-900/80 border-emerald-500/30 text-center">
          <p className="text-emerald-400 font-semibold text-sm">
            Update Successful
          </p>
          <p className="text-zinc-300 text-xs mt-1">{msg}</p>
        </div>
      );
    }

    // 3. Check if it's select bindings query
    if (result.head?.vars && result.results?.bindings) {
      const vars = result.head.vars as string[];
      const bindings = result.results.bindings as Array<
        Record<string, { value: any; type: string }>
      >;

      if (bindings.length === 0) {
        return (
          <p className="text-zinc-400 text-sm py-4">
            Query returned 0 results.
          </p>
        );
      }

      return (
        <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-950">
          <table className="w-full text-left text-sm text-zinc-300 border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 font-medium">
                {vars.map((v) => (
                  <th
                    key={v}
                    className="p-3 border-r border-zinc-800 last:border-r-0"
                  >
                    ?{v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bindings.map((binding, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900/50"
                >
                  {vars.map((v) => {
                    const cell = binding[v];
                    return (
                      <td
                        key={v}
                        className="p-3 border-r border-zinc-800 last:border-r-0 font-mono text-xs break-all max-w-xs"
                      >
                        {cell ? String(cell.value) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 3. Fallback raw JSON view
    return (
      <pre className="p-4 border rounded bg-zinc-900 border-zinc-800 text-xs font-mono overflow-auto max-h-96 text-zinc-300">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="SPARQL Query Editor"
          description="Directly query and manipulate the Graph store of your World"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={setToken} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Preset / Saved Queries Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="border-zinc-800 bg-zinc-950 text-white">
              <CardHeader className="pb-3 border-b border-zinc-900">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" /> Preset Queries
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-1">
                {PRESET_QUERIES.map((q) => (
                  <Button
                    key={q.name}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs truncate"
                    onClick={() => setQuery(q.query)}
                  >
                    {q.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-950 text-white">
              <CardHeader className="pb-3 border-b border-zinc-900">
                <CardTitle className="text-sm font-semibold">
                  Saved Queries
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {customQueries.length === 0 ? (
                  <p className="text-zinc-500 text-xs">No saved queries yet.</p>
                ) : (
                  <div className="space-y-1">
                    {customQueries.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between group"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start text-left text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs truncate"
                          onClick={() => setQuery(q.query)}
                        >
                          {q.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteQuery(idx)}
                          aria-label={`Delete saved query ${q.name}`}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-900 space-y-2">
                  <Label
                    htmlFor="save-query-name"
                    className="text-xs text-zinc-400"
                  >
                    Save Current Query
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="save-query-name"
                      placeholder="Query name"
                      value={newQueryName}
                      onChange={(e) => setNewQueryName(e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white"
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2"
                      onClick={saveQuery}
                      disabled={!newQueryName.trim()}
                    >
                      <Save className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor & Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="flex justify-between items-center p-3 bg-zinc-900 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400">
                  Query Editor
                </span>
                <Button
                  onClick={executeQuery}
                  disabled={loading}
                  size="sm"
                  className="gap-1.5 h-8"
                >
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5 fill-current" />
                  )}
                  Execute Query
                </Button>
              </div>
              <CardContent className="p-0">
                <Editor
                  height="260px"
                  language="sql" // Fallback language since monaco doesn't have SPARQL builtin by default
                  theme="vs-dark"
                  value={query}
                  onChange={(val) => setQuery(val || "")}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    automaticLayout: true,
                  }}
                />
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border border-zinc-800 bg-zinc-950">
              <CardHeader className="pb-3 border-b border-zinc-900 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white">
                  Results
                </CardTitle>
                {timeTakenMs !== null && (
                  <span className="text-xs text-zinc-500">
                    Query executed in {timeTakenMs}ms
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {error && <ErrorCard message={error} />}
                {!error && !result && !loading && (
                  <p className="text-zinc-500 text-xs py-4 text-center">
                    Execute a query to see results here.
                  </p>
                )}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-zinc-400 text-xs">
                      Running query against World Graph...
                    </p>
                  </div>
                )}
                {!loading && renderResults()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
