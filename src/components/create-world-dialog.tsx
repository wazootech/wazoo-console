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
import { createWorld } from "@wazoo/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateWorldDialog({ open, onOpenChange, onCreated }: Props) {
  const { client } = useAuth();
  const [worldId, setWorldId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setError(null);
    setLoading(true);
    const r = await createWorld({
      client,
      body: { worldId, world: { displayName: displayName || worldId, region } },
    });
    if (r.error) {
      setError(errMsg(r.error));
    } else {
      setWorldId("");
      setDisplayName("");
      setRegion("auto");
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create World</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worldId">World ID</Label>
            <Input
              id="worldId"
              placeholder="my-world"
              value={worldId}
              onChange={(e) => setWorldId(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, digits, and hyphens. 3-63 characters.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="My World"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
            />
          </div>
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

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
