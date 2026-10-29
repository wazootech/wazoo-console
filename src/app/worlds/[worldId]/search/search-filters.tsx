import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchFiltersProps {
  limit: number;
  setLimit: (v: number) => void;
  minScore: number;
  setMinScore: (v: number) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  typeOptions: string[];
  propFilter: string;
  setPropFilter: (v: string) => void;
  labelFilter: string;
  setLabelFilter: (v: string) => void;
}

export function SearchFilters(p: SearchFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
      <div className="space-y-1.5">
        <Label htmlFor="limit" className="text-zinc-400 text-xs">
          Limit
        </Label>
        <Input
          id="limit"
          type="number"
          min={1}
          max={100}
          value={p.limit}
          onChange={(e) => p.setLimit(parseInt(e.target.value) || 10)}
          className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="min-score" className="text-zinc-400 text-xs">
          Min Similarity Score
        </Label>
        <Input
          id="min-score"
          type="number"
          step={0.01}
          min={0}
          max={1}
          value={p.minScore}
          onChange={(e) => p.setMinScore(parseFloat(e.target.value) || 0)}
          className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="type-filter" className="text-zinc-400 text-xs">
          Type (rdf:type)
        </Label>
        <select
          id="type-filter"
          value={p.typeFilter}
          onChange={(e) => p.setTypeFilter(e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 text-white text-xs px-2"
        >
          <option value="">All types</option>
          {p.typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="prop-filter" className="text-zinc-400 text-xs">
          Property (predicate contains)
        </Label>
        <Input
          id="prop-filter"
          type="text"
          placeholder="e.g. #label"
          value={p.propFilter}
          onChange={(e) => p.setPropFilter(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="label-filter" className="text-zinc-400 text-xs">
          Label / object contains
        </Label>
        <Input
          id="label-filter"
          type="text"
          placeholder="e.g. agent"
          value={p.labelFilter}
          onChange={(e) => p.setLabelFilter(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-white h-9 text-xs"
        />
      </div>
    </div>
  );
}
