"use client";

import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LogOut,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getHealth } from "@wazoo/client";

interface DeletionInitiated {
  deletion: { uid: string; expiresAt: string };
  confirmationToken: string;
  message: string;
}

export default function SettingsPage() {
  const { user, client, logout } = useAuth();
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, setPending] = useState<DeletionInitiated | null>(null);

  useEffect(() => {
    if (!client) return;
    getHealth({ client }).then((r) => setApiOk(!r.error));
  }, [client]);

  async function handleExport() {
    if (!client) return;
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/auth/export", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          body.error?.message ?? "Export failed. Please try again.",
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wazoo-data-${user?.uid ?? "user"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleInitiateDelete() {
    if (!client) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as
        DeletionInitiated | { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ??
            "Could not start account deletion. Please try again.",
        );
      }
      setPending(body as DeletionInitiated);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Deletion failed.");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!client || !pending) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/deletion", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationToken: pending.confirmationToken }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          body.error?.message ?? "Could not delete the account. Try again.",
        );
      }
      await logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Deletion failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <PageHeader
          title="Settings"
          description="Account information and API status"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono">{user?.uid}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {apiOk === null ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : apiOk ? (
                <Badge className="gap-1">
                  <CheckCircle className="size-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  Error
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                api.wazoo.dev
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Export a copy of the data Wazoo holds on your account, or
                permanently delete the account and its data.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting || !client}
                >
                  {exporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Export my data
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }}
                  disabled={!client}
                >
                  <Trash2 className="size-4" />
                  Delete account
                </Button>
              </div>
              {exportError ? (
                <p role="alert" className="text-sm text-destructive mt-3">
                  {exportError}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => logout()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

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
    </AppShell>
  );
}
