"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { TokenSecretCard } from "@/components/token-secret-card";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  listWorldTokens,
  createWorldToken,
  deleteWorldToken,
  type WorldToken,
} from "@wazoo/client";

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
    uid: string;
    name: string;
    token: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const tabs = [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];

  async function fetchTokens() {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await listWorldTokens({ client, path: { worldId } });
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
    const r = await createWorldToken({ client, path: { worldId } });
    if (r.error) {
      setError(errMsg(r.error));
      return;
    }
    const t = r.data?.token;
    if (t)
      setNewToken({
        uid: t.uid,
        name: t.name,
        token: (t as WorldToken & { token: string }).token ?? "",
      });
    fetchTokens();
  }

  async function handleRevoke(tokenUid: string) {
    if (!client) return;
    await deleteWorldToken({ client, path: { worldId, tokenUid } });
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
              <Card key={t.uid}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.uid}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Revoke token ${t.name}`}
                    onClick={() => handleRevoke(t.uid)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
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
