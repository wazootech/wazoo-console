import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Sparkles } from "lucide-react";
import { PRESET_QUERIES } from "./sparql-presets";

interface SparqlSidebarProps {
  customQueries: Array<{ name: string; query: string }>;
  newQueryName: string;
  setNewQueryName: (v: string) => void;
  setQuery: (q: string) => void;
  saveQuery: () => void;
  deleteQuery: (index: number) => void;
}

/** Preset / Saved Queries Sidebar */
export function SparqlSidebar({
  customQueries,
  newQueryName,
  setNewQueryName,
  setQuery,
  saveQuery,
  deleteQuery,
}: SparqlSidebarProps) {
  return (
    <div className="space-y-4 lg:col-span-1">
      <Card className="border-zinc-800 bg-zinc-950 text-white">
        <CardHeader className="pb-3 border-b border-zinc-900">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> Preset Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-1">
          {PRESET_QUERIES.map((q) => (
            <Button
              key={q.name}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs truncate"
              onClick={() => setQuery(q.query)}
            >
              {q.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950 text-white">
        <CardHeader className="pb-3 border-b border-zinc-900">
          <CardTitle className="text-sm font-semibold">Saved Queries</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          {customQueries.length === 0 ? (
            <p className="text-zinc-500 text-xs">No saved queries yet.</p>
          ) : (
            <div className="space-y-1">
              {customQueries.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between group"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start text-left text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs truncate"
                    onClick={() => setQuery(q.query)}
                  >
                    {q.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteQuery(idx)}
                    aria-label={`Delete saved query ${q.name}`}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-zinc-900 space-y-2">
            <Label htmlFor="save-query-name" className="text-xs text-zinc-400">
              Save Current Query
            </Label>
            <div className="flex gap-2">
              <Input
                id="save-query-name"
                placeholder="Query name"
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.target.value)}
                className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white"
              />
              <Button
                size="sm"
                className="h-8 px-2"
                onClick={saveQuery}
                disabled={!newQueryName.trim()}
              >
                <Save className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
