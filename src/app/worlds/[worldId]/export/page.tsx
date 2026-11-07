"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { ErrorCard } from "@/components/error-card";
import { WorldTokenErrorCard } from "@/components/world-token-error-card";
import { getWorldTabs, translateWorldTabLabel } from "@/lib/utils";
import { useWorldExport } from "./use-world-export";
import { ExportFormatGrid } from "./export-format-grid";
import { ExportActionsCard } from "./export-actions-card";
import { useGT } from "gt-next";

export default function ExportPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const gt = useGT();
  const tabs = getWorldTabs(worldId).map((t) => ({
    ...t,
    label: translateWorldTabLabel(gt, t.label),
  }));
  const x = useWorldExport(worldId);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={gt("Export World")}
          description={gt(
            "Export graph triples, quads, and text data into standard RDF formats",
          )}
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
