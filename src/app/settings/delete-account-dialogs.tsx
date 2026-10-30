import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import type { DeletionInitiated } from "./use-account-data";

interface DeleteAccountDialogsProps {
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  deleting: boolean;
  deleteError: string | null;
  pending: DeletionInitiated | null;
  setPending: (p: DeletionInitiated | null) => void;
  handleInitiateDelete: () => void;
  handleConfirmDelete: () => void;
}

export function DeleteAccountDialogs({
  deleteOpen,
  setDeleteOpen,
  deleting,
  deleteError,
  pending,
  setPending,
  handleInitiateDelete,
  handleConfirmDelete,
}: DeleteAccountDialogsProps) {
  return (
    <>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, worlds, tokens, and usage
              data. Exported data can no longer be recovered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleInitiateDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>{pending?.message}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              This step must be completed within 15 minutes. Once confirmed, you
              will be signed out.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPending(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
                Permanently delete account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
