import { ChevronDown, ChevronRight } from "lucide-react";
import type { SearchResult } from "./search-types";

interface SearchResultsTableProps {
  results: SearchResult[];
  detailSubject: string | null;
  onInspect: (subject: string) => void;
}

export function SearchResultsTable({
  results,
  detailSubject,
  onInspect,
}: SearchResultsTableProps) {
  return (
    <div className="overflow-x-auto border border-zinc-800 rounded bg-zinc-900/30">
      <table className="w-full text-left text-xs text-zinc-300 border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-medium">
            <th className="p-3 w-8" />
            <th className="p-3 border-r border-zinc-800">Subject</th>
            <th className="p-3 border-r border-zinc-800">Predicate</th>
            <th className="p-3 border-r border-zinc-800">Content</th>
            <th className="p-3 border-r border-zinc-800">Score</th>
            <th className="p-3">Graph</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => (
            <tr
              key={r.id ?? idx}
              className={`border-b border-zinc-800 last:border-b-0 ${
                detailSubject === r.subject
                  ? "bg-primary/5"
                  : "hover:bg-zinc-900/10"
              }`}
            >
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => onInspect(r.subject)}
                  aria-expanded={detailSubject === r.subject}
                  aria-label={`Inspect ${r.subject}`}
                  className="text-zinc-500 hover:text-primary transition-colors"
                >
                  {detailSubject === r.subject ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              </td>
              <td className="p-3 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                {r.subject}
              </td>
              <td className="p-3 border-r border-zinc-800 font-mono break-all max-w-[120px]">
                {r.predicate}
              </td>
              <td className="p-3 border-r border-zinc-800 break-words text-zinc-200">
                {r.content || "—"}
              </td>
              <td className="p-3 border-r border-zinc-800 font-semibold text-primary">
                {r.score != null ? r.score.toFixed(4) : "—"}
              </td>
              <td className="p-3 font-mono break-all max-w-[100px]">
                {r.graph || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
