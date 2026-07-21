"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, AlertCircle, Globe } from "lucide-react";
import Link from "next/link";
import { CreateWorldDialog } from "@/components/create-world-dialog";
import { listWorlds, type World } from "@wazoo/client";

const stateVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  DELETED: "destructive",
};

export default function WorldsPage() {
  const { client } = useAuth();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function fetchWorlds() {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await listWorlds({ client });
    if (r.error) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Worlds</h1>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4" /> Create World
          </Button>
        </div>
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="size-5 text-destructive shrink-0" />
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWorlds}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
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
                className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
