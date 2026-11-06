"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWorldTabs } from "@/lib/utils";
import { Upload, CheckCircle, Loader2, ClipboardPaste } from "lucide-react";
import { useImportForm } from "./use-import-form";
import { ImportFileInput } from "./import-file-input";
import { ImportPasteInput } from "./import-paste-input";
import { ImportPreview } from "./import-preview";

const modeClass = (active: boolean) =>
  `flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active ? "bg-primary/15 text-primary" : "text-zinc-400 hover:text-zinc-200"
  }`;

export default function ImportPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);
  const f = useImportForm(worldId);
  const { mode, success, loading } = f;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Import Data"
          description="Load graph quads or plain text chunks into your World"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={f.setToken} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border border-zinc-800 bg-zinc-950 text-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Import Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
                  <button
                    type="button"
                    onClick={() => f.setMode("file")}
                    className={modeClass(mode === "file")}
                  >
                    <Upload className="size-3.5" />
                    Upload file
                  </button>
                  <button
                    type="button"
                    onClick={() => f.setMode("paste")}
                    className={modeClass(mode === "paste")}
                  >
                    <ClipboardPaste className="size-3.5" />
                    Paste text
                  </button>
                </div>

                {mode === "file" ? (
                  <ImportFileInput {...f} />
                ) : (
                  <ImportPasteInput {...f} />
                )}

                <Button
                  onClick={f.handleImport}
                  disabled={
                    loading ||
                    (mode === "file" ? !f.fileContent : !f.pasteContent.trim())
                  }
                  className="w-full h-10 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      Importing...
                    </>
                  ) : (
                    "Execute Import"
                  )}
                </Button>
              </CardContent>
            </Card>

            {success && (
              <Card className="border border-green-900 bg-green-950/10 text-green-400">
                <CardContent className="pt-6 flex items-start gap-3">
                  <CheckCircle className="size-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      Import Successful
                    </p>
                    <p className="text-xs text-green-300">
                      Successfully imported:
                      {success.quads > 0 && ` ${success.quads} quads`}
                      {success.chunks > 0 && ` ${success.chunks} text chunks`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-4">
            <ImportPreview
              error={f.error}
              parsedQuads={f.parsedQuads}
              parsedLines={f.parsedLines}
              isEmpty={!f.file && !f.pasteContent.trim()}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
