"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getLocalWorldTokens,
  saveLocalWorldToken,
  type SavedWorldToken,
} from "@/lib/utils";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ManualTokenForm } from "./manual-token-form";
import { TokenSelect } from "./token-select";
import { NoTokensNotice } from "./no-tokens-notice";

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
  }, [worldId, onTokenChange]);

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
              Manage Tokens
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
            onSubmit={handleAddManualToken}
            onCancel={() => {
              setShowManualForm(false);
              if (tokens.length > 0) {
                setSelectedTokenValue(tokens[0].token);
                onTokenChange(tokens[0].token);
              } else {
                setSelectedTokenValue("");
              }
            }}
          />
        )}

        {tokens.length === 0 && !showManualForm && (
          <NoTokensNotice worldId={worldId} />
        )}
      </CardContent>
    </Card>
  );
}
