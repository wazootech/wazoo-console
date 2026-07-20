"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { listWorldTokens, createWorldToken, deleteWorldToken, type WorldToken } from "@wazoo/client";

export default function WorldTokensPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = use(params);
  const { client } = useAuth();
  const [tokens, setTokens] = useState<WorldToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<{ uid: string; name: string; token: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const tabs = [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];

  async function fetchTokens() {
    if (!client) return;
    setLoading(true); setError(null);
    const r = await listWorldTokens({ client, path: { worldId } });
    if (r.error) { setError(errMsg(r.error)); } else { setTokens(r.data?.tokens ?? []); }
    setLoading(false);
  }

  useEffect(() => { fetchTokens(); }, [client, worldId]);

  async function handleCreate() {
    if (!client) return;
    setError(null);
    const r = await createWorldToken({ client, path: { worldId } });
    if (r.error) { setError(errMsg(r.error)); return; }
    const t = r.data?.token;
    if (t) setNewToken({ uid: t.uid, name: t.name, token: (t as WorldToken & { token: string }).token ?? "" });
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">World Tokens</h1>
          <Button onClick={handleCreate}><Plus className="size-4" /> Create Token</Button>
        </div>
        <NavTabs tabs={tabs} />
        {newToken && (
          <Card className="border-primary">
            <CardHeader><CardTitle className="text-sm">New Token Created</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Copy this token now. It will not be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-secondary px-3 py-2 text-sm font-mono break-all">{showSecret ? newToken.token : "•".repeat(40)}</code>
                <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>{showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setNewToken(null)}>Dismiss</Button>
            </CardContent>
          </Card>
        )}
        {loading && <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}
        {!loading && tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((t) => (
              <Card key={t.uid}><CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{t.name}</p><p className="text-xs text-muted-foreground truncate">{t.uid}</p></div>
                <Button variant="ghost" size="icon" onClick={() => handleRevoke(t.uid)}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </CardContent></Card>
            ))}
          </div>
        )}
        {!loading && tokens.length === 0 && !error && <Card><CardContent className="py-8 text-center text-muted-foreground">No world tokens yet.</CardContent></Card>}
        {error && <Card className="border-destructive"><CardContent className="py-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
      </div>
    </AppShell>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err) return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
