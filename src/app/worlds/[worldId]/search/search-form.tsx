import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { SearchFilters } from "./search-filters";

type SearchFormProps = React.ComponentProps<typeof SearchFilters> & {
  handleSearch: (e: React.FormEvent) => void;
  query: string;
  setQuery: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  loading: boolean;
};

export function SearchForm(p: SearchFormProps) {
  return (
    <form onSubmit={p.handleSearch} className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            placeholder="e.g. Find references to agent status, memory history, or profile definitions..."
            value={p.query}
            onChange={(e) => p.setQuery(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white pl-9 h-11 text-sm focus:border-primary"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => p.setShowFilters(!p.showFilters)}
          className="border-zinc-800 hover:bg-zinc-900 h-11"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
        <Button
          type="submit"
          disabled={p.loading}
          className="h-11 px-6 font-semibold"
        >
          {p.loading ? <Loader2 className="size-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {p.showFilters && <SearchFilters {...p} />}
    </form>
  );
}
