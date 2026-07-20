"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { deleteWorld } from "@wazoo/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  onDeleted: () => void;
}

export function DeleteWorldDialog({ open, onOpenChange, worldId, onDeleted }: Props) {
  const { client } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== worldId || !client) return;
    setError(null); setLoading(true);
    const r = await deleteWorld({ client, path: { worldId } });
    if (r.error) { setError(errMsg(r.error)); }
    else { onOpenChange(false); onDeleted(); }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete World</DialogTitle><DialogDescription>This action cannot be undone. Type <strong>{worldId}</strong> to confirm.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Input placeholder={worldId} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button><Button variant="destructive" onClick={handleDelete} disabled={confirm !== worldId || loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}Delete</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err) return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
