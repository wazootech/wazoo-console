"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  parseWorldTokens,
  saveLocalWorldToken,
  worldTokensKey,
  type SavedWorldToken,
} from "@/lib/utils";
import { useStoredValue } from "@/lib/use-stored-value";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ManualTokenForm } from "./manual-token-form";
import { TokenSelect } from "./token-select";
import { NoTokensNotice } from "./no-tokens-notice";
import { useGT } from "gt-next";

function parseSavedTokens(raw: string | null): SavedWorldToken[] {
  try {
    return parseWorldTokens(raw);
  } catch (err) {
    console.error("Could not load saved world tokens", err);
    return [];
  }
}

interface WorldTokenSelectorProps {
  worldId: string;
  onTokenChange: (token: string | null) => void;
}

export function WorldTokenSelector({
  worldId,
  onTokenChange,
}: WorldTokenSelectorProps) {
  const gt = useGT();
  const raw = useStoredValue(worldTokensKey(worldId));
  const tokens = useMemo(() => parseSavedTokens(raw), [raw]);
  // The user's pick for this world; until they pick, the first saved token is used.
  const [choice, setChoice] = useState<{
    worldId: string;
    value: string;
  } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [manualName, setManualName] = useState("");
  const [showTokenSecret, setShowTokenSecret] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const selectedTokenValue =
    choice?.worldId === worldId ? choice.value : (tokens[0]?.token ?? "");
  const showManualForm = selectedTokenValue === "manual";
  const activeToken = showManualForm ? null : selectedTokenValue || null;

  useEffect(() => {
    onTokenChange(activeToken);
  }, [activeToken, onTokenChange]);

  function handleSelectChange(val: string) {
    setChoice({ worldId, value: val });
    setSaveFailed(false);
  }

  function handleAddManualToken(e: React.FormEvent) {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;

    const name =
      manualName.trim() || `Imported Key (${manualToken.slice(0, 8)}...)`;
    const saved = saveLocalWorldToken(worldId, token, name);
    setSaveFailed(!saved);
    if (!saved) return;

    setChoice({ worldId, value: token });
    setManualToken("");
    setManualName("");
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
              {gt("World Access Token")}
            </Label>
            <div className="flex items-center gap-2">
              <TokenSelect
                tokens={tokens}
                value={selectedTokenValue}
                onChange={handleSelectChange}
              />
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={`/worlds/${worldId}/tokens`}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-zinc-800 bg-transparent shadow-sm hover:bg-zinc-900 text-white h-8 px-3"
            >
              {gt("Manage Tokens")}
            </Link>
          </div>
        </div>

        {showManualForm && (
          <ManualTokenForm
            manualName={manualName}
            setManualName={setManualName}
            manualToken={manualToken}
            setManualToken={setManualToken}
            showTokenSecret={showTokenSecret}
            setShowTokenSecret={setShowTokenSecret}
            saveFailed={saveFailed}
            onSubmit={handleAddManualToken}
            onCancel={() => setChoice(null)}
          />
        )}

        {tokens.length === 0 && !showManualForm && (
          <NoTokensNotice worldId={worldId} />
        )}
      </CardContent>
    </Card>
  );
}
