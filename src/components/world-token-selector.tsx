"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLocalWorldTokens,
  saveLocalWorldToken,
  type SavedWorldToken,
} from "@/lib/utils";
import Link from "next/link";
import { KeyRound, Plus, Eye, EyeOff } from "lucide-react";

interface WorldTokenSelectorProps {
  worldId: string;
  onTokenChange: (token: string | null) => void;
}

export function WorldTokenSelector({
  worldId,
  onTokenChange,
}: WorldTokenSelectorProps) {
  const [tokens, setTokens] = useState<SavedWorldToken[]>([]);
  const [selectedTokenValue, setSelectedTokenValue] = useState<string>("");
  const [manualToken, setManualToken] = useState("");
  const [manualName, setManualName] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showTokenSecret, setShowTokenSecret] = useState(false);

  useEffect(() => {
    const list = getLocalWorldTokens(worldId);
    setTokens(list);
    if (list.length > 0) {
      setSelectedTokenValue(list[0].token);
      onTokenChange(list[0].token);
    } else {
      setSelectedTokenValue("");
      onTokenChange(null);
    }
  }, [worldId]);

  function handleSelectChange(val: string) {
    setSelectedTokenValue(val);
    if (val === "manual") {
      setShowManualForm(true);
      onTokenChange(null);
    } else {
      setShowManualForm(false);
      onTokenChange(val || null);
    }
  }

  function handleAddManualToken(e: React.FormEvent) {
    e.preventDefault();
    if (!manualToken.trim()) return;

    const name =
      manualName.trim() || `Imported Key (${manualToken.slice(0, 8)}...)`;
    saveLocalWorldToken(worldId, manualToken.trim(), name);

    const updated = getLocalWorldTokens(worldId);
    setTokens(updated);
    setSelectedTokenValue(manualToken.trim());
    onTokenChange(manualToken.trim());
    setManualToken("");
    setManualName("");
    setShowManualForm(false);
  }

  return (
    <Card className="border border-zinc-800 bg-zinc-950">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Label
              htmlFor="token-select"
              className="text-zinc-400 flex items-center gap-1.5"
            >
              <KeyRound className="size-4 text-primary" />
              World Access Token
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedTokenValue}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger
                  id="token-select"
                  className="w-full bg-zinc-900 border-zinc-800 text-white"
                >
                  <SelectValue placeholder="Select a token or add one..." />
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
                  <SelectItem
                    value="manual"
                    className="text-primary font-medium"
                  >
                    + Add token manually
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={`/worlds/${worldId}/tokens`}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-zinc-800 bg-transparent shadow-sm hover:bg-zinc-900 text-white h-8 px-3"
            >
              Manage Tokens
            </Link>
          </div>
        </div>

        {showManualForm && (
          <form
            onSubmit={handleAddManualToken}
            className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50"
          >
            <h3 className="text-sm font-semibold text-white">
              Add World Access Token
            </h3>
            <div className="space-y-2">
              <Label htmlFor="manual-name" className="text-zinc-400">
                Token Name / Label
              </Label>
              <Input
                id="manual-name"
                placeholder="e.g. My Dev Token"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-token" className="text-zinc-400">
                Token Secret Key
              </Label>
              <div className="relative">
                <Input
                  id="manual-token"
                  type={showTokenSecret ? "text" : "password"}
                  placeholder="wzp_..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTokenSecret(!showTokenSecret)}
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
                onClick={() => {
                  setShowManualForm(false);
                  if (tokens.length > 0) {
                    setSelectedTokenValue(tokens[0].token);
                    onTokenChange(tokens[0].token);
                  } else {
                    setSelectedTokenValue("");
                  }
                }}
                className="hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save & Select
              </Button>
            </div>
          </form>
        )}

        {tokens.length === 0 && !showManualForm && (
          <div className="p-3 border border-dashed border-amber-900/50 rounded bg-amber-950/10 text-amber-500 text-xs">
            No access tokens found for this World in your browser's local
            storage. Go to the{" "}
            <Link
              href={`/worlds/${worldId}/tokens`}
              className="underline font-semibold hover:text-amber-400"
            >
              Tokens page
            </Link>{" "}
            to generate one, or select "+ Add token manually" above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
