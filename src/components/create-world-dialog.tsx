"use client";

import { useEffect, useRef, useState } from "react";
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
import { createWorld } from "@/lib/platform-id-client";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { errMsg, isUnauthorizedError, quotaErrorInfo } from "@/lib/quota-error";

export function CreateWorldDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { client, logout } = useAuth();
  const displayNameRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [createdWorldId, setCreatedWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ usagePercent?: number } | null>(
    null,
  );

  const canSubmit = !loading && displayName.trim().length > 0;

  useEffect(() => {
    if (open) {
      setDisplayName("");
      setCreatedWorldId(null);
      setError(null);
      setLimitInfo(null);
      setLoading(false);
      setTimeout(() => displayNameRef.current?.focus(), 0);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setError(null);
    setLimitInfo(null);
    setLoading(true);
    const r = await createWorld(client, {
      world: { displayName: displayName.trim() },
    });
    if (r.error) {
      if (isUnauthorizedError(r.error)) {
        logout();
        return;
      }
      setError(errMsg(r.error));
      setLimitInfo(quotaErrorInfo(r.error));
    } else {
      const createdId = r.data?.world?.id;
      if (createdId) {
        setCreatedWorldId(createdId);
        onCreated();
      } else {
        setError("The API response did not include the created world ID.");
      }
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create World</DialogTitle>
        </DialogHeader>
        {createdWorldId ? (
          <div className="space-y-4">
            <p role="status">World created successfully.</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">World ID</p>
              <code
                data-testid="created-world-id"
                className="block break-all rounded-md border bg-muted p-3 text-sm"
              >
                {createdWorldId}
              </code>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                ref={displayNameRef}
                id="displayName"
                placeholder="My World"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                A human-readable name for this world. You can change it later.
              </p>
            </div>
            {error && (
              <QuotaErrorBanner
                message={error}
                usagePercent={limitInfo?.usagePercent}
                hint={
                  limitInfo
                    ? "Delete unused worlds or raise the database limit to create more."
                    : undefined
                }
              />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
