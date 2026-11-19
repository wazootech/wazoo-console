"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { CreatedWorldView } from "./created-world-view";
import { QuotaErrorBanner } from "@/components/quota-error-banner";
import { isUnauthorizedError, quotaErrorInfo } from "@/lib/quota-error";
import {
  createWorldByDisplayName,
  worldIdentityErrorMessage,
} from "@/lib/world-identity";
import { useGT } from "gt-next";

/**
 * CreateWorldForm holds the create-world form state. CreateWorldDialog mounts it
 * only while the dialog is open, so each opening starts from a blank form.
 */
export function CreateWorldForm({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const gt = useGT();
  const { client, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [createdWorldId, setCreatedWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ usagePercent?: number } | null>(
    null,
  );

  const canSubmit = !loading && displayName.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setError(null);
    setLimitInfo(null);
    setLoading(true);
    const result = await createWorldByDisplayName(client, displayName.trim());
    if (result.error !== undefined) {
      if (isUnauthorizedError(result.error)) {
        logout();
        return;
      }
      setError(worldIdentityErrorMessage(result.error));
      setLimitInfo(quotaErrorInfo(result.error));
    } else if (result.data) {
      setCreatedWorldId(result.data.id);
      onCreated();
    } else {
      setError(
        gt("The Worlds API did not return the created world's canonical ID."),
      );
    }
    setLoading(false);
  }

  return (
    <>
      {createdWorldId ? (
        <CreatedWorldView
          worldId={createdWorldId}
          onDone={() => onOpenChange(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{gt("Display name")}</Label>
            <Input
              id="displayName"
              autoFocus
              placeholder={gt("My World")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              {gt(
                "A human-readable name for this world. You can change it later.",
              )}
            </p>
          </div>
          {error && (
            <QuotaErrorBanner
              message={error}
              usagePercent={limitInfo?.usagePercent}
              hint={
                limitInfo
                  ? gt(
                      "Delete unused worlds or raise the database limit to create more.",
                    )
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
              {gt("Cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {gt("Create")}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
