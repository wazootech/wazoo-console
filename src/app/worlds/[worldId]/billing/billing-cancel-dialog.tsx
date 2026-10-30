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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel subscription</DialogTitle>
          <DialogDescription>
            This ends your subscription. Your world and its data stay intact.
            Type <strong>{worldId}</strong> to confirm.
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
              Keep subscription
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={confirm !== worldId || cancelling}
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : null}
              Cancel subscription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
