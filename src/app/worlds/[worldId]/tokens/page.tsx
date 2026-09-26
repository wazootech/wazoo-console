"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { TokenSecretCard } from "@/components/token-secret-card";
import { TokenListItem } from "@/components/token-list-item";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getWorldTabs, saveLocalWorldToken } from "@/lib/utils";
import type { WorldToken } from "@/lib/platform-id-client";
import {
  fetchWorldTokens,
  issueWorldToken,
  revokeWorldToken,
} from "@/lib/platform-id-client";

export default function WorldTokensPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const { client } = useAuth();
  const [tokens, setTokens] = useState<WorldToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<{
    tokenId: string;
    name: string;
    token: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const tabs = getWorldTabs(worldId);

  async function fetchTokens() {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await fetchWorldTokens(client, worldId);
    if (r.error) {
      setError(errMsg(r.error));
    } else {
      setTokens(r.data?.tokens ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTokens();
  }, [client, worldId]);

  async function handleCreate() {
    if (!client) return;
    setError(null);
    const r = await issueWorldToken(client, worldId);
    if (r.error) {
      setError(errMsg(r.error));
      return;
    }
    const t = r.data?.token;
    if (t) {
      const tokenStr = t.token ?? "";
      setNewToken({
        tokenId: t.tokenId,
        name: t.name,
        token: tokenStr,
      });
      saveLocalWorldToken(worldId, tokenStr, t.name);
    }
    fetchTokens();
  }

  async function handleRevoke(tokenId: string) {
    if (!client) return;
    await revokeWorldToken(client, worldId, tokenId);
    fetchTokens();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="World Tokens"
          description="Manage access tokens for this world"
          actions={
            <Button onClick={handleCreate}>
              <Plus className="size-4" /> Create Token
            </Button>
          }
        />
        <NavTabs tabs={tabs} />
        {newToken && (
          <TokenSecretCard
            token={newToken.token}
            showSecret={showSecret}
            maskedLength={40}
            onToggle={() => setShowSecret(!showSecret)}
            onDismiss={() => setNewToken(null)}
          />
        )}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((t) => (
              <TokenListItem
                key={t.tokenId}
                name={t.name}
                tokenId={t.tokenId}
                typeBadge="World Token"
                onRevoke={() => handleRevoke(t.tokenId)}
              />
            ))}
          </div>
        )}
        {!loading && tokens.length === 0 && !error && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No world tokens yet.
            </CardContent>
          </Card>
        )}
        {error && <ErrorCard message={error} />}
      </div>
    </AppShell>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
