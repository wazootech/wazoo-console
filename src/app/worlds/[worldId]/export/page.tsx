"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { ErrorCard } from "@/components/error-card";
import { WorldTokenErrorCard } from "@/components/world-token-error-card";
import { getWorldTabs } from "@/lib/utils";
import { useWorldExport } from "./use-world-export";
import { ExportFormatGrid } from "./export-format-grid";
import { ExportActionsCard } from "./export-actions-card";

export default function ExportPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);
  const x = useWorldExport(worldId);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Export World"
          description="Export graph triples, quads, and text data into standard RDF formats"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={x.setToken} />

        {x.invalidTokenError ? (
          <WorldTokenErrorCard worldId={worldId} />
        ) : (
          x.error && <ErrorCard message={x.error} />
        )}

        <ExportFormatGrid
          selectedFormat={x.selectedFormat}
          onSelect={x.handleFormatSelect}
        />

        <ExportActionsCard worldId={worldId} {...x} />
      </div>
    </AppShell>
  );
}
