"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/error-card";
import { getWorldsApiUrl, getWorldTabs } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Database,
  Download,
  FileCode,
  Loader2,
} from "lucide-react";

interface ExportFormat {
  id: string;
  name: string;
  mime: string;
  ext: string;
  description: string;
  example: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "json",
    name: "JSON (Quads)",
    mime: "application/json",
    ext: ".json",
    description:
      "Array of quad objects with subject, predicate, object, and graph fields.",
    example: '[{"subject": "ex:s", "predicate": "ex:p", "object": "ex:o"}]',
  },
  {
    id: "turtle",
    name: "Turtle",
    mime: "text/turtle",
    ext: ".ttl",
    description:
      "Compact RDF Turtle syntax with prefixes and graph directives.",
    example: '<http://example.org/s> <http://example.org/p> "object" .',
  },
  {
    id: "n-quads",
    name: "N-Quads",
    mime: "application/n-quads",
    ext: ".nq",
    description:
      "Line-based RDF format representing quads with explicit graph context.",
    example:
      "<http://ex.org/s> <http://ex.org/p> <http://ex.org/o> <http://ex.org/g> .",
  },
  {
    id: "n-triples",
    name: "N-Triples",
    mime: "application/n-triples",
    ext: ".nt",
    description: "Simple line-based triples format without graph qualifiers.",
    example: '<http://example.org/s> <http://example.org/p> "object" .',
  },
  {
    id: "text",
    name: "Plain Text",
    mime: "text/plain",
    ext: ".txt",
    description:
      "Raw text chunk lines imported or inferred for full-text and vector search.",
    example: "Document content text line for semantic search and indexing.",
  },
];

export default function ExportPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);

  const [token, setToken] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    EXPORT_FORMATS[0],
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchExportData(format: ExportFormat) {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return null;
    }

    setError(null);
    setIsEmpty(false);

    try {
      const endpoint = `${getWorldsApiUrl()}/worlds/${worldId}/export?format=${
        encodeURIComponent(
          format.mime,
        )
      }`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error?.message || `Export failed with status ${res.status}`,
        );
      }

      const text = await res.text();
      if (!text || text.trim() === "" || text.trim() === "[]") {
        setIsEmpty(true);
        setPreviewContent(null);
        return "";
      }

      setPreviewContent(text);
      return text;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during export");
      setPreviewContent(null);
      return null;
    }
  }

  async function handleFormatSelect(format: ExportFormat) {
    setSelectedFormat(format);
    setPreviewContent(null);
    setError(null);
    if (token) {
      setLoading(true);
      await fetchExportData(format);
      setLoading(false);
    }
  }

  async function handleLoadPreview() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    setLoading(true);
    await fetchExportData(selectedFormat);
    setLoading(false);
  }

  async function handleDownload() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }

    setDownloading(true);
    let data = previewContent;
    if (data === null) {
      data = await fetchExportData(selectedFormat);
    }

    setDownloading(false);

    if (data === null || isEmpty) return;

    const blob = new Blob([data], { type: selectedFormat.mime });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `world-${worldId}-${dateStr}${selectedFormat.ext}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleCopy = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Export World"
          description="Export graph triples, quads, and text data into standard RDF formats"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={setToken} />

        {error && <ErrorCard message={error} />}

        {/* Format Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              Select Export Format
            </h2>
            <span className="text-xs text-zinc-500">5 formats available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPORT_FORMATS.map((fmt) => {
              const isSelected = selectedFormat.id === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleFormatSelect(fmt)}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,140,0,0.15)] text-white"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {fmt.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                          isSelected
                            ? "border-primary/40 bg-primary/20 text-primary-foreground"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {fmt.ext}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {fmt.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 truncate">
                    {fmt.mime}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action & Preview Card */}
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
                  {copied
                    ? (
                      <>
                        <Check className="size-3.5 text-green-400" />
                        Copied
                      </>
                    )
                    : (
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
                {loading
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <FileCode className="size-3.5" />}
                {previewContent ? "Refresh Preview" : "Preview Sample"}
              </Button>

              <Button
                size="sm"
                onClick={handleDownload}
                disabled={downloading || loading || !token}
                className="h-8 font-semibold text-xs gap-1.5"
              >
                {downloading
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Download className="size-3.5" />}
                Download {selectedFormat.ext}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isEmpty && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <AlertCircle className="size-8 text-amber-500/80" />
                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-semibold text-white">
                    World is Empty
                  </p>
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
                  Click <strong>Download {selectedFormat.ext}</strong>{" "}
                  to save the exported data file, or click{" "}
                  <strong>Preview Sample</strong> to inspect content inline.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs">Fetching export data from server...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
