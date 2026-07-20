"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
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
  const { token } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== worldId) return;
    if (!token) return;
    setError(null);
    setLoading(true);
    const r = await api.deleteWorld({ token }, worldId);
    if (r.error) {
      setError(
        typeof r.error === "object" && "error" in r.error
          ? (r.error as { error: { message: string } }).error.message
          : "Failed to delete",
      );
      setLoading(false);
    } else {
      setLoading(false);
      onOpenChange(false);
      onDeleted();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete World</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Type <strong>{worldId}</strong> to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={worldId}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirm !== worldId || loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
