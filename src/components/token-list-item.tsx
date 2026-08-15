"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TokenListItemProps {
  name: string;
  uid?: string;
  scopes?: string[];
  typeBadge?: string;
  onRevoke: () => void;
}

export function TokenListItem({
  name,
  uid,
  scopes,
  typeBadge,
  onRevoke,
}: TokenListItemProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyUid() {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-colors">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex items-center justify-center size-10 rounded-lg bg-zinc-900 border border-zinc-800 text-primary shrink-0">
          <KeyRound className="size-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white truncate text-sm">
              {name}
            </span>
            {typeBadge && (
              <Badge
                variant="outline"
                className="text-[10px] border-zinc-700 text-zinc-300"
              >
                {typeBadge}
              </Badge>
            )}
          </div>

          {uid && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="truncate max-w-[280px] sm:max-w-xs">{uid}</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
                aria-label="Copy Token UID"
                title="Copy Token UID"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          )}

          {scopes && scopes.length > 0 && (
            <div className="flex gap-1 pt-1 flex-wrap">
              {scopes.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800"
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={`Revoke token ${name}`}
          onClick={onRevoke}
          className="text-zinc-400 hover:text-red-400 hover:bg-zinc-900 shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
