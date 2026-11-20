"use client";

import { useCallback, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/use-api-query";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { TokenSecretCard } from "@/components/token-secret-card";
import { TokenListItem } from "@/components/token-list-item";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import {
  getWorldTabs,
  saveLocalWorldToken,
  translateWorldTabLabel,
} from "@/lib/utils";
import { useGT } from "gt-next";
import {
  listWorldTokens,
  createWorldToken,
  deleteWorldToken,
  type Client,
  type WorldToken,
} from "@wazoo/client";

export default function WorldTokensPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const gt = useGT();
  const { worldId } = use(params);
  const { client } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<{
    uid: string;
    name: string;
    token: string;
    saveFailed: boolean;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const tabs = getWorldTabs(worldId).map((t) => ({
    ...t,
    label: translateWorldTabLabel(gt, t.label),
  }));

  const listTokens = useCallback(
    (c: Client) => listWorldTokens({ client: c, path: { worldId } }),
    [worldId],
  );
  const { data: result, loading, reload } = useApiQuery(listTokens);
  const tokens: WorldToken[] = result?.data?.tokens ?? [];
  const error = actionError ?? (result?.error ? errMsg(result.error) : null);

  async function handleCreate() {
    if (!client) return;
    setActionError(null);
    const r = await createWorldToken({ client, path: { worldId } });
    if (r.error) {
      setActionError(errMsg(r.error));
      return;
    }
    const t = r.data?.token;
    if (t) {
      const tokenStr = (t as WorldToken & { token: string }).token ?? "";
      setNewToken({
        uid: t.uid,
        name: t.name,
        token: tokenStr,
        saveFailed: !saveLocalWorldToken(worldId, tokenStr, t.name),
      });
    }
    reload();
  }

  async function handleRevoke(tokenUid: string) {
    if (!client) return;
    await deleteWorldToken({ client, path: { worldId, tokenUid } });
    reload();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={gt("World Tokens")}
          description={gt("Manage access tokens for this world")}
          actions={
            <Button onClick={handleCreate}>
              <Plus className="size-4" /> {gt("Create Token")}
            </Button>
          }
        />
        <NavTabs tabs={tabs} />
        {newToken && (
          <TokenSecretCard
            token={newToken.token}
            saveFailed={newToken.saveFailed}
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
                key={t.uid}
                name={t.name}
                uid={t.uid}
                typeBadge={gt("World Token")}
                onRevoke={() => handleRevoke(t.uid)}
              />
            ))}
          </div>
        )}
        {!loading && tokens.length === 0 && !error && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {gt("No world tokens yet.")}
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
