import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorCard } from "@/components/error-card";
import { AlertCircle } from "lucide-react";
import type { ParsedQuad } from "./import-parse";

interface ImportPreviewProps {
  error: string | null;
  parsedQuads: ParsedQuad[];
  parsedLines: string[];
  isEmpty: boolean;
}

export function ImportPreview({
  error,
  parsedQuads,
  parsedLines,
  isEmpty,
}: ImportPreviewProps) {
  return (
    <Card className="border border-zinc-800 bg-zinc-950 text-white min-h-[350px]">
      <CardHeader className="border-b border-zinc-900">
        <CardTitle className="text-sm font-semibold">Import Preview</CardTitle>
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
                    <th className="p-2 border-r border-zinc-800">Subject</th>
                    <th className="p-2 border-r border-zinc-800">Predicate</th>
                    <th className="p-2 border-r border-zinc-800">Object</th>
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

        {!error && isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <AlertCircle className="size-6 mb-2 text-zinc-600" />
            <p className="text-xs">
              Upload a file or paste text on the left to see a preview.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
