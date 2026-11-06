"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { deleteWorld } from "@wazoo/client";
import { useGT } from "gt-next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onDeleted: () => void;
}

export function DeleteWorldDialog({
  open,
  onOpenChange,
  worldId,
  onDeleted,
}: Props) {
  const { client } = useAuth();
  const gt = useGT();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== worldId || !client) return;
    setError(null);
    setLoading(true);
    const r = await deleteWorld({ client, path: { worldId } });
    if (r.error) {
      setError(errMsg(r.error));
    } else {
      onOpenChange(false);
      onDeleted();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gt("Delete World")}</DialogTitle>
          <DialogDescription>
            {gt("This action cannot be undone.")}{" "}
            {gt("Type {worldId} to confirm.", {
              worldId,
              $context: "Confirmation prompt before deleting a world",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={worldId}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {gt("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirm !== worldId || loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {gt("Delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
