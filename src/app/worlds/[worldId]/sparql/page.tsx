"use client";

import { useState, use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/error-card";
import { WorldTokenErrorCard } from "@/components/world-token-error-card";
import { getWorldTabs } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { Play, Loader2 } from "lucide-react";
import { PRESET_QUERIES } from "./sparql-presets";
import { useSavedQueries } from "./use-saved-queries";
import { useSparqlExecution } from "./use-sparql-execution";
import { SparqlResults } from "./sparql-results";
import { SparqlSidebar } from "./sparql-sidebar";

export default function SparqlPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);

  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState(PRESET_QUERIES[0].query);
  const saved = useSavedQueries(worldId, query);
  const run = useSparqlExecution(worldId, token, query);
  const { loading, error, invalidTokenError, result, timeTakenMs } = run;

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
          <SparqlSidebar {...saved} setQuery={setQuery} />

          {/* Main Editor & Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="flex justify-between items-center p-3 bg-zinc-900 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400">
                  Query Editor
                </span>
                <Button
                  onClick={run.executeQuery}
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
                {invalidTokenError ? (
                  <WorldTokenErrorCard worldId={worldId} />
                ) : (
                  error && <ErrorCard message={error} />
                )}
                {!invalidTokenError && !error && !result && !loading && (
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
                {!loading && <SparqlResults result={result} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
