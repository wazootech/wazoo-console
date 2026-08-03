"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ErrorCard } from "@/components/error-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { CreateWorldDialog } from "@/components/create-world-dialog";
import { listWorlds, type World } from "@wazoo/client";

const stateVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  DELETED: "destructive",
};

export default function WorldsPage() {
  const { client, logout } = useAuth();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const existingWorldIds = useMemo(
    () => new Set(worlds.map((w) => w.worldId)),
    [worlds],
  );

  async function fetchWorlds() {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await listWorlds({ client });
    if (r.error) {
      if (
        typeof r.error === "object" &&
        r.error !== null &&
        "status" in r.error &&
        (r.error as any).status === 401
      ) {
        logout();
        return;
      }
      setError(errMsg(r.error));
    } else {
      setWorlds(r.data?.worlds ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchWorlds();
  }, [client]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Worlds"
          description="Manage your knowledge worlds"
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" /> Create World
            </Button>
          }
        />
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <ErrorCard
            message={error}
            action={
              <Button variant="outline" size="sm" onClick={fetchWorlds}>
                Retry
              </Button>
            }
          />
        )}
        {!loading && !error && worlds.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Globe className="size-10 text-muted-foreground" />
              <p className="text-muted-foreground">No Worlds yet.</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="size-4" /> Create your first World
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && worlds.length > 0 && (
          <div className="space-y-2">
            {worlds.map((w) => (
              <Link
                key={w.uid}
                href={`/worlds/${w.worldId}`}
                className="block rounded-md border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {w.displayName}
                      </span>
                      <Badge variant={stateVariant[w.state] ?? "secondary"}>
                        {w.state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {w.worldId}
                    </p>
                  </div>
                </CardContent>
              </Link>
            ))}
          </div>
        )}
        <CreateWorldDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={fetchWorlds}
          existingWorldIds={existingWorldIds}
        />
      </div>
    </AppShell>
  );
}

function errMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err)
    return (err as { error: { message: string } }).error.message;
  return "Unknown error";
}
