"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export interface DeletionInitiated {
  deletion: { uid: string; expiresAt: string };
  confirmationToken: string;
  message: string;
}

export function useAccountData() {
  const { user, client, logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, setPending] = useState<DeletionInitiated | null>(null);

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

  return {
    user,
    client,
    logout,
    exporting,
    exportError,
    deleteOpen,
    setDeleteOpen,
    deleting,
    deleteError,
    setDeleteError,
    pending,
    setPending,
    handleExport,
    handleInitiateDelete,
    handleConfirmDelete,
  };
}
