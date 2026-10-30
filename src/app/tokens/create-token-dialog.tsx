"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createPlatformToken } from "@wazoo/client";
import { ScopeSelector } from "@/components/scope-selector";
import { errMsg } from "./err-msg";

export function CreateTokenDialog({
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
