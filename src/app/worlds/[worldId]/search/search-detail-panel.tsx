import { Loader2, X } from "lucide-react";
import { ErrorCard } from "@/components/error-card";
import type { DetailQuad } from "./search-types";

interface SearchDetailPanelProps {
  subject: string;
  quads: DetailQuad[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function SearchDetailPanel({
  subject,
  quads,
  loading,
  error,
  onClose,
}: SearchDetailPanelProps) {
  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/40">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-200">Subject detail</p>
          <p className="font-mono text-[11px] text-zinc-500 break-all">
            {subject}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4">
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Loader2 className="size-4 animate-spin" />
            Loading all quads for subject...
          </div>
        )}
        {error && <ErrorCard message={error} />}
        {!loading && !error && quads.length === 0 && (
          <p className="text-zinc-500 text-xs">
            No quads found for this subject.
          </p>
        )}
        {!loading && quads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="text-zinc-400 font-medium border-b border-zinc-800">
                  <th className="py-2 pr-3">Predicate</th>
                  <th className="py-2 pr-3">Object</th>
                  <th className="py-2">Graph</th>
                </tr>
              </thead>
              <tbody>
                {quads.map((q, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-900 last:border-b-0"
                  >
                    <td className="py-2 pr-3 font-mono break-all max-w-[160px]">
                      {q.predicate}
                    </td>
                    <td className="py-2 pr-3 break-words text-zinc-200">
                      {q.object}
                    </td>
                    <td className="py-2 font-mono break-all max-w-[120px]">
                      {q.graph || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
