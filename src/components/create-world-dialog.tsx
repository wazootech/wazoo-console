"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check, X } from "lucide-react";
import { createWorld } from "@wazoo/client";
import {
  validateWorldId,
  isWorldIdTaken,
  suggestWorldId,
} from "@/lib/world-id";

const regionOptions = [
  { value: "auto", label: "Automatic" },
  { value: "us-east", label: "US East" },
] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  existingWorldIds: Set<string>;
}

export function CreateWorldDialog({
  open,
  onOpenChange,
  onCreated,
  existingWorldIds,
}: Props) {
  const { client, logout } = useAuth();
  const displayNameRef = useRef<HTMLInputElement>(null);
  const [worldId, setWorldId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedWorldId = useDebounce(worldId, 250);
  const validationError = validateWorldId(debouncedWorldId);
  const taken =
    !validationError &&
    debouncedWorldId &&
    isWorldIdTaken(debouncedWorldId, existingWorldIds);
  const canSubmit =
    !loading &&
    !validateWorldId(worldId) &&
    !isWorldIdTaken(worldId, existingWorldIds) &&
    worldId.length > 0;

  useEffect(() => {
    if (open) {
      setWorldId(suggestWorldId(existingWorldIds));
      setDisplayName("");
      setRegion("auto");
      setError(null);
      setLoading(false);
      setTimeout(() => displayNameRef.current?.focus(), 0);
    }
  }, [open]);

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
      if (isUnauthorizedError(r.error)) {
        logout();
        return;
      }
      setError(errMsg(r.error));
    } else {
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
              aria-describedby="world-id-feedback world-id-hint"
              aria-invalid={!!validationError || !!taken}
            />
            <p id="world-id-hint" className="text-xs text-muted-foreground">
              Lowercase letters, digits, and hyphens. 3-63 characters.
            </p>
            <div
              id="world-id-feedback"
              className="flex items-center gap-1.5 min-h-5"
            >
              {validationError && (
                <span
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <X className="size-3" /> {validationError}
                </span>
              )}
              {!validationError && taken && (
                <span
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <X className="size-3" /> Already taken.
                </span>
              )}
              {!validationError && !taken && worldId && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="size-3" /> Available
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              ref={displayNameRef}
              id="displayName"
              placeholder="My World"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              A human-readable name for this world. You can change it later.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion} disabled={loading}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent position="popper">
                {regionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={!canSubmit}>
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

function isUnauthorizedError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    if ("status" in err && (err as { status: number }).status === 401) return true;
    if ("error" in err) {
      const msg = (err as { error: { message?: string; code?: string } }).error;
      if (msg?.code === "UNAUTHORIZED" || msg?.message?.toLowerCase().includes("token is expired") || msg?.message?.toLowerCase().includes("unauthorized")) {
        return true;
      }
    }
  }
  return false;
}
