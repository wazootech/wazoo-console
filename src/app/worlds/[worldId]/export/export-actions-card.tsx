import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Copy,
  Database,
  Download,
  FileCode,
  Loader2,
} from "lucide-react";
import type { ExportFormat } from "./export-formats";
import { ExportPreviewBody } from "./export-preview-body";

interface ExportActionsCardProps {
  worldId: string;
  token: string | null;
  selectedFormat: ExportFormat;
  loading: boolean;
  downloading: boolean;
  previewContent: string | null;
  isEmpty: boolean;
  copied: boolean;
  handleCopy: () => void;
  handleLoadPreview: () => void;
  handleDownload: () => void;
}

/** Action & Preview Card */
export function ExportActionsCard({
  worldId,
  token,
  selectedFormat,
  loading,
  downloading,
  previewContent,
  isEmpty,
  copied,
  handleCopy,
  handleLoadPreview,
  handleDownload,
}: ExportActionsCardProps) {
  return (
    <Card className="border border-zinc-800 bg-zinc-950 text-white">
      <CardHeader className="border-b border-zinc-900 flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Database className="size-4 text-primary" />
          Export Actions — {selectedFormat.name} ({selectedFormat.ext})
        </CardTitle>

        <div className="flex items-center gap-3">
          {previewContent && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy Preview
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadPreview}
            disabled={loading || !token}
            className="h-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileCode className="size-3.5" />
            )}
            {previewContent ? "Refresh Preview" : "Preview Sample"}
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading || loading || !token}
            className="h-8 font-semibold text-xs gap-1.5"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download {selectedFormat.ext}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ExportPreviewBody
          worldId={worldId}
          selectedFormat={selectedFormat}
          loading={loading}
          previewContent={previewContent}
          isEmpty={isEmpty}
        />
      </CardContent>
    </Card>
  );
}
