import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, FileCode, Loader2 } from "lucide-react";
import type { ExportFormat } from "./export-formats";

interface ExportPreviewBodyProps {
  worldId: string;
  selectedFormat: ExportFormat;
  loading: boolean;
  previewContent: string | null;
  isEmpty: boolean;
}

export function ExportPreviewBody({
  worldId,
  selectedFormat,
  loading,
  previewContent,
  isEmpty,
}: ExportPreviewBodyProps) {
  return (
    <>
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <AlertCircle className="size-8 text-amber-500/80" />
          <div className="space-y-1 max-w-sm">
            <p className="text-sm font-semibold text-white">World is Empty</p>
            <p className="text-xs text-zinc-400">
              This world contains no quads or text data to export yet. Try
              importing RDF graph files or plain text first.
            </p>
          </div>
          <Link href={`/worlds/${worldId}/import`}>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs gap-1.5 border-zinc-800"
            >
              Go to Import Page
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {!isEmpty && previewContent && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Export Content Preview ({selectedFormat.mime})</span>
            <span>{previewContent.split("\n").length} lines</span>
          </div>
          <pre className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[400px] leading-relaxed whitespace-pre-wrap">
            {previewContent}
          </pre>
        </div>
      )}

      {!isEmpty && !previewContent && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-center space-y-2">
          <FileCode className="size-8 text-zinc-600 mb-1" />
          <p className="text-xs text-zinc-400 font-medium">
            Ready to export in {selectedFormat.name} format
          </p>
          <p className="text-[11px] text-zinc-500 max-w-md">
            Click <strong>Download {selectedFormat.ext}</strong> to save the
            exported data file, or click <strong>Preview Sample</strong> to
            inspect content inline.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs">Fetching export data from server...</p>
        </div>
      )}
    </>
  );
}
