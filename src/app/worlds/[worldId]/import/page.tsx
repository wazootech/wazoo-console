"use client";

import { useState, use, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NavTabs } from "@/components/nav-tabs";
import { WorldTokenSelector } from "@/components/world-token-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/error-card";
import { getWorldTabs, getWorldsApiUrl } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  ClipboardPaste,
} from "lucide-react";

interface ParsedQuad {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
}

export default function ImportPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const tabs = getWorldTabs(worldId);

  const [token, setToken] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [contentType, setContentType] = useState<string>("application/json");
  const [parsedQuads, setParsedQuads] = useState<ParsedQuad[]>([]);
  const [parsedLines, setParsedLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    quads: number;
    chunks: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteType, setPasteType] = useState<"json" | "text">("json");

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);
    setSuccess(null);
    setFile(selectedFile);

    const isJson = selectedFile.name.endsWith(".json");
    const isCsv = selectedFile.name.endsWith(".csv");
    const isTxt = selectedFile.name.endsWith(".txt");

    if (!isJson && !isCsv && !isTxt) {
      setError(
        "Unsupported file format. Please upload a .json, .csv, or .txt file.",
      );
      setFile(null);
      return;
    }

    const type = isJson ? "application/json" : "text/plain";
    setContentType(type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);

      if (isJson) {
        try {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            throw new Error("JSON file must contain an array of quad objects.");
          }
          // Validate structure
          const valid = parsed.every(
            (item: any) =>
              typeof item === "object" &&
              item !== null &&
              "subject" in item &&
              "predicate" in item &&
              "object" in item,
          );
          if (!valid) {
            throw new Error(
              "Each object in the array must contain 'subject', 'predicate', and 'object' fields.",
            );
          }
          setParsedQuads(parsed);
          setParsedLines([]);
        } catch (err: any) {
          setError(`JSON Parse Error: ${err.message}`);
          setFile(null);
        }
      } else {
        // Plain text or CSV
        const lines = content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        setParsedLines(lines);
        setParsedQuads([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  function processPaste() {
    setError(null);
    setSuccess(null);

    if (pasteType === "json") {
      try {
        const parsed = JSON.parse(pasteContent);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON must contain an array of quad objects.");
        }
        const valid = parsed.every(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            "subject" in item &&
            "predicate" in item &&
            "object" in item,
        );
        if (!valid) {
          throw new Error(
            "Each object in the array must contain 'subject', 'predicate', and 'object' fields.",
          );
        }
        setParsedQuads(parsed);
        setParsedLines([]);
      } catch (err: any) {
        setError(`JSON Parse Error: ${err.message}`);
        setParsedQuads([]);
        setParsedLines([]);
      }
    } else {
      const lines = pasteContent
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      setParsedLines(lines);
      setParsedQuads([]);
    }
  }

  async function handleImport() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    if (mode === "paste") {
      if (!pasteContent.trim()) {
        setError("Paste some content to import.");
        return;
      }
      setFileContent(pasteContent);
      setContentType(pasteType === "json" ? "application/json" : "text/plain");
    } else if (!fileContent) {
      setError("No file content loaded to import.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = `${getWorldsApiUrl()}/worlds/${worldId}/import`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: fileContent,
          contentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to import graph data");
      }

      setSuccess({
        quads: data.imported?.quads || 0,
        chunks: data.imported?.chunks || 0,
      });
      // Clear input state
      setFile(null);
      setFileContent("");
      setPasteContent("");
      setParsedQuads([]);
      setParsedLines([]);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during import");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Import Data"
          description="Load graph quads or plain text chunks into your World"
        />
        <NavTabs tabs={tabs} />

        <WorldTokenSelector worldId={worldId} onTokenChange={setToken} />

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
                    onClick={() => setMode("file")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "file"
                        ? "bg-primary/15 text-primary"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Upload className="size-3.5" />
                    Upload file
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("paste")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "paste"
                        ? "bg-primary/15 text-primary"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <ClipboardPaste className="size-3.5" />
                    Paste text
                  </button>
                </div>

                {mode === "file" ? (
                  <>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept=".json,.txt,.csv"
                      />
                      <Upload className="size-8 text-zinc-500 mb-3" />
                      <p className="text-sm text-zinc-300 font-medium">
                        Drag and drop file here
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports JSON (quads), CSV, TXT (chunks)
                      </p>
                    </div>

                    {file && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                        <FileText className="size-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate text-zinc-200">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {(file.size / 1024).toFixed(1)} KB • {contentType}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
                      <button
                        type="button"
                        onClick={() => setPasteType("json")}
                        className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          pasteType === "json"
                            ? "bg-primary/15 text-primary"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        JSON quads
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasteType("text")}
                        className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          pasteType === "text"
                            ? "bg-primary/15 text-primary"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Plain text
                      </button>
                    </div>
                    <textarea
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder={
                        pasteType === "json"
                          ? '[{"subject": "https://example.org/alice", "predicate": "https://schema.org/givenName", "object": "Alice"}]'
                          : "One text chunk per line. Each line becomes a chunk indexed for full-text and vector search."
                      }
                      rows={8}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                    {pasteContent.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={processPaste}
                        className="border-zinc-800 hover:bg-zinc-900"
                      >
                        Preview
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={
                    loading ||
                    (mode === "file" ? !fileContent : !pasteContent.trim())
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
            <Card className="border border-zinc-800 bg-zinc-950 text-white min-h-[350px]">
              <CardHeader className="border-b border-zinc-900">
                <CardTitle className="text-sm font-semibold">
                  Import Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {error && <ErrorCard message={error} />}

                {!error && parsedQuads.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Parsed {parsedQuads.length} quads</span>
                      <span>Showing first 5 quads</span>
                    </div>
                    <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-900/30">
                      <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-medium">
                            <th className="p-2 border-r border-zinc-800">
                              Subject
                            </th>
                            <th className="p-2 border-r border-zinc-800">
                              Predicate
                            </th>
                            <th className="p-2 border-r border-zinc-800">
                              Object
                            </th>
                            <th className="p-2">Graph</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedQuads.slice(0, 5).map((q, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900/10"
                            >
                              <td className="p-2 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                                {q.subject}
                              </td>
                              <td className="p-2 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                                {q.predicate}
                              </td>
                              <td className="p-2 border-r border-zinc-800 font-mono break-all max-w-[150px]">
                                {q.object}
                              </td>
                              <td className="p-2 font-mono break-all max-w-[100px]">
                                {q.graph || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!error && parsedLines.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Parsed {parsedLines.length} lines</span>
                      <span>Showing first 5 chunks</span>
                    </div>
                    <div className="border border-zinc-800 rounded bg-zinc-900/30 divide-y divide-zinc-800">
                      {parsedLines.slice(0, 5).map((l, idx) => (
                        <div
                          key={idx}
                          className="p-3 text-xs font-mono break-words text-zinc-300 flex items-start gap-2.5"
                        >
                          <span className="text-[10px] text-zinc-500 select-none bg-zinc-900 border border-zinc-800 px-1 rounded">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!error && !file && !pasteContent.trim() && (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <AlertCircle className="size-6 mb-2 text-zinc-600" />
                    <p className="text-xs">
                      Upload a file or paste text on the left to see a preview.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
