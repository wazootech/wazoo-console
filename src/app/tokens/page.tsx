"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { TokenSecretCard } from "@/components/token-secret-card";
import { TokenListItem } from "@/components/token-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  listPlatformTokens,
  createPlatformToken,
  deletePlatformToken,
  type PlatformToken,
} from "@wazoo/client";

import { ScopeSelector } from "@/components/scope-selector";

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

  async function fetchTokens() {
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
  }

  useEffect(() => {
    fetchTokens();
  }, [client]);

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

function CreateTokenDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (uid: string, name: string, token: string) => void;
}) {
  const { client, user } = useAuth();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [isScopeValid, setIsScopeValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !isScopeValid) return;
    setError(null);
    setLoading(true);
    const r = await createPlatformToken({
      client,
      body: {
        email: user?.email ?? undefined,
        name,
        scope: scope || undefined,
      },
    });
    if (r.error) {
      setError(errMsg(r.error));
      setLoading(false);
      return;
    }
    const d = r.data;
    if (d?.token) {
      setName("");
      setScope("");
      onOpenChange(false);
      onCreated(d.uid, d.name, d.token);
    } else {
      setError("No token in response");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Token</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenName">Name</Label>
            <Input
              id="tokenName"
              placeholder="my-token"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>
          <ScopeSelector
            value={scope}
            onChange={setScope}
            disabled={loading}
            onValidationChange={setIsScopeValid}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isScopeValid}>
              {loading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground mr-1" />
              ) : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
