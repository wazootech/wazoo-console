import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useGT } from "gt-next";

interface ManualTokenFormProps {
  manualName: string;
  setManualName: (v: string) => void;
  manualToken: string;
  setManualToken: (v: string) => void;
  showTokenSecret: boolean;
  setShowTokenSecret: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function ManualTokenForm({
  manualName,
  setManualName,
  manualToken,
  setManualToken,
  showTokenSecret,
  setShowTokenSecret,
  onSubmit,
  onCancel,
}: ManualTokenFormProps) {
  const gt = useGT();
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">
          {gt("Import an existing token")}
        </h3>
        <p className="text-xs text-zinc-400">
          {gt(
            "Generate a token on the Tokens page first, then enter its secret here. This only imports the existing token into this browser; it does not create a token.",
          )}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-name" className="text-zinc-400">
          {gt("Local Token Label (optional)")}
        </Label>
        <Input
          id="manual-name"
          placeholder={gt("e.g. My Dev Token")}
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-token" className="text-zinc-400">
          {gt("Existing Token Secret")}
        </Label>
        <div className="relative">
          <Input
            id="manual-token"
            type={showTokenSecret ? "text" : "password"}
            placeholder={gt("wzw_...")}
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowTokenSecret(!showTokenSecret)}
            aria-label={
              showTokenSecret
                ? gt("Hide token secret")
                : gt("Show token secret")
            }
            aria-pressed={showTokenSecret}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
          >
            {showTokenSecret ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="hover:bg-zinc-800"
        >
          {gt("Cancel")}
        </Button>
        <Button type="submit" size="sm">
          {gt("Import & Select")}
        </Button>
      </div>
    </form>
  );
}
