"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { TokenSecretCard } from "@/components/token-secret-card";
import { TokenListItem } from "@/components/token-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import {
  listPlatformTokens,
  deletePlatformToken,
  type PlatformToken,
} from "@wazoo/client";
import { CreateTokenDialog } from "./create-token-dialog";
import { errMsg } from "./err-msg";

export default function TokensPage() {
  const { client } = useAuth();
  const [tokens, setTokens] = useState<PlatformToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<{
    uid: string;
    name: string;
    token: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const fetchTokens = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await listPlatformTokens({ client });
    if (r.error) {
      setError(errMsg(r.error));
    } else {
      setTokens(r.data?.tokens ?? []);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function handleRevoke(tokenName: string) {
    if (!client) return;
    const res = await deletePlatformToken({ client, path: { tokenName } });
    if (res.error) {
      setError(errMsg(res.error));
      return;
    }
    fetchTokens();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="API Tokens"
          description="Manage platform API tokens for authentication"
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" /> Create Token
            </Button>
          }
        />
        {newSecret && (
          <TokenSecretCard
            token={newSecret.token}
            showSecret={showSecret}
            maskedLength={60}
            onToggle={() => setShowSecret(!showSecret)}
            onDismiss={() => setNewSecret(null)}
          />
        )}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <ErrorCard message={error} />}
        {!loading && tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((t) => (
              <TokenListItem
                key={t.uid}
                name={t.name}
                uid={t.uid}
                typeBadge="Platform Token"
                scopes={
                  t.scope ? t.scope.split(/\s+/).filter(Boolean) : undefined
                }
                onRevoke={() => handleRevoke(t.name)}
              />
            ))}
          </div>
        )}
        {!loading && tokens.length === 0 && !error && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No API tokens yet.
            </CardContent>
          </Card>
        )}
        <CreateTokenDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={(uid, name, token) => {
            setNewSecret({ uid, name, token });
            fetchTokens();
          }}
        />
      </div>
    </AppShell>
  );
}
