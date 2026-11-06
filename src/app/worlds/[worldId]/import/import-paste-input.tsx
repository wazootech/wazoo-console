import { Button } from "@/components/ui/button";

interface ImportPasteInputProps {
  pasteType: "json" | "text";
  setPasteType: (t: "json" | "text") => void;
  pasteContent: string;
  setPasteContent: (v: string) => void;
  processPaste: () => void;
}

const tabClass = (active: boolean) =>
  `flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
    active ? "bg-primary/15 text-primary" : "text-zinc-400 hover:text-zinc-200"
  }`;

export function ImportPasteInput({
  pasteType,
  setPasteType,
  pasteContent,
  setPasteContent,
  processPaste,
}: ImportPasteInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
        <button
          type="button"
          onClick={() => setPasteType("json")}
          className={tabClass(pasteType === "json")}
        >
          JSON quads
        </button>
        <button
          type="button"
          onClick={() => setPasteType("text")}
          className={tabClass(pasteType === "text")}
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
            : "One text chunk per line. Each line becomes a chunk indexed for full-text search."
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
  );
}
