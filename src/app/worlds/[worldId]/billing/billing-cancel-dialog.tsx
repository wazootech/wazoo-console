import { QuotaErrorBanner } from "@/components/quota-error-banner";
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
import { useGT } from "gt-next";

interface BillingCancelDialogProps {
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  cancelling: boolean;
  cancelError: string | null;
  onCancel: () => void;
}

export function BillingCancelDialog({
  worldId,
  open,
  onOpenChange,
  confirm,
  setConfirm,
  cancelling,
  cancelError,
  onCancel,
}: BillingCancelDialogProps) {
  const gt = useGT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gt("Cancel subscription")}</DialogTitle>
          <DialogDescription>
            {gt(
              "This ends your subscription. Your world and its data stay intact.",
            )}{" "}
            {gt("Type {worldId} to confirm.", {
              worldId,
              $context: "Confirmation prompt before cancelling a subscription",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={worldId}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={cancelling}
          />
          {cancelError && <QuotaErrorBanner message={cancelError} />}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelling}
            >
              {gt("Keep subscription")}
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={confirm !== worldId || cancelling}
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : null}
              {gt("Cancel subscription")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
