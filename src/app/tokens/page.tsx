"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, type PlatformToken } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";

export default function TokensPage() {
  const { token } = useAuth();
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
    if (!token) return;
    setLoading(true);
    setError(null);
    const r = await api.listPlatformTokens({ token });
    if (r.error) {
      setError(
        typeof r.error === "object" && "error" in r.error
          ? (r.error as { error: { message: string } }).error.message
          : "Failed to load tokens",
      );
    } else {
      setTokens(r.data?.tokens ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTokens();
  }, [token]);

  async function handleRevoke(tokenName: string) {
    if (!token) return;
    await api.deletePlatformToken({ token }, tokenName);
    fetchTokens();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">API Tokens</h1>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4" /> Create Token
          </Button>
        </div>

        {newSecret && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-sm">New Token Created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Copy this token now. <strong>It will not be shown again.</strong>
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-secondary px-3 py-2 text-sm font-mono break-all">
                  {showSecret ? newSecret.token : "•".repeat(60)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewSecret(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
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
                    {t.scope && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {t.scope.split(/\s+/).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {t.last_used_at
                      ? `Last used: ${new Date(t.last_used_at).toLocaleString()}`
                      : "Never used"}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(t.name)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && tokens.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No API tokens yet.
            </CardContent>
          </Card>
        )}

        <CreateTokenDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={(uid, name, tokenSecret) => {
            setNewSecret({ uid, name, token: tokenSecret });
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
  onOpenChange: (open: boolean) => void;
  onCreated: (uid: string, name: string, token: string) => void;
}) {
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    const r = await api.createPlatformToken({ token }, {
      name,
      scope: scope || undefined,
      email: user?.email,
    });

    if (r.error) {
      setError(
        typeof r.error === "object" && "error" in r.error
          ? (r.error as { error: { message: string } }).error.message
          : "Failed to create token",
      );
      setLoading(false);
      return;
    }

    const data = r.data;
    if (data?.token) {
      setLoading(false);
      setName("");
      setScope("");
      onOpenChange(false);
      onCreated(data.uid, data.name, data.token);
    } else {
      setError("No token in response");
      setLoading(false);
    }
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
          <div className="space-y-2">
            <Label htmlFor="scope">Scopes (optional)</Label>
            <Input
              id="scope"
              placeholder="users.read worlds.read worlds.write usage.read billing.read"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Space-separated scope names. Empty = all default scopes.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
