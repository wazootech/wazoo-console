"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorCard } from "@/components/error-card";
import { getWorldTabs } from "@/lib/utils";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { MODE_BADGES } from "./search-types";
import { useWorldSearch } from "./use-world-search";
import { SearchForm } from "./search-form";
import { SearchResultsTable } from "./search-results-table";
import { SearchDetailPanel } from "./search-detail-panel";

export default function SearchPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);
  const s = useWorldSearch(worldId);
  const { mode, error, results, loading, filteredResults } = s;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="World Graph Search"
          description="Full-text search across the world's graph data, with automatic fallback when the search index is unavailable. The badge on each result set shows which mode actually ran."
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={s.setToken} />

        <div className="space-y-4">
          <Card className="border border-zinc-800 bg-zinc-950 text-white">
            <CardContent className="pt-6">
              <SearchForm {...s} />
            </CardContent>
          </Card>

          {/* Results display */}
          <Card className="border border-zinc-800 bg-zinc-950 text-white min-h-[250px]">
            <CardHeader className="border-b border-zinc-900 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" /> Query Results
              </CardTitle>
              {mode && MODE_BADGES[mode] && (
                <div
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
                    MODE_BADGES[mode].className
                  }`}
                >
                  {mode === "fallback" ? (
                    <AlertTriangle className="size-3 shrink-0" />
                  ) : (
                    <Sparkles className="size-3 shrink-0" />
                  )}
                  {MODE_BADGES[mode].label}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {error && <ErrorCard message={error} />}

              {!error && results.length === 0 && !loading && (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Enter a search query to search the world graph.
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-zinc-400 text-xs">
                    Searching the world graph...
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
                    <SearchResultsTable
                      results={filteredResults}
                      detailSubject={s.detailSubject}
                      onInspect={s.openDetail}
                    />
                  )}

                  {s.detailSubject && (
                    <SearchDetailPanel
                      subject={s.detailSubject}
                      quads={s.detailQuads}
                      loading={s.detailLoading}
                      error={s.detailError}
                      onClose={s.closeDetail}
                    />
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
