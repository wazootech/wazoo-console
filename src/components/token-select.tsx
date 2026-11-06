import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SavedWorldToken } from "@/lib/utils";
import { useGT } from "gt-next";

interface TokenSelectProps {
  tokens: SavedWorldToken[];
  value: string;
  onChange: (val: string) => void;
}

export function TokenSelect({ tokens, value, onChange }: TokenSelectProps) {
  const gt = useGT();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id="token-select"
        className="w-full bg-zinc-900 border-zinc-800 text-white"
      >
        <SelectValue placeholder={gt("Select a token or import one...")} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
        {tokens.map((t) => (
          <SelectItem key={t.token} value={t.token}>
            <span className="font-medium">{t.name}</span>
            <span className="ml-2 text-xs text-zinc-500 font-mono">
              ({t.token.slice(0, 10)}...)
            </span>
          </SelectItem>
        ))}
        <SelectItem value="manual" className="text-primary font-medium">
          {gt("+ Import existing token")}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
