"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { NavTabs } from "@/components/nav-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { DeleteWorldDialog } from "@/components/delete-world-dialog";
import { getWorld, type World } from "@wazoo/client";

const stateVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  DELETED: "destructive",
};

export default function WorldDetailPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const { client } = useAuth();
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function fetchWorld() {
    if (!client) return;
    setLoading(true);
    setError(null);
    const r = await getWorld({ client, path: { worldId } });
    if (r.error) {
      setError(errMsg(r.error));
    } else {
      setWorld(r.data?.world ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchWorld();
  }, [client, worldId]);

  const tabs = [
    { label: "Overview", href: `/worlds/${worldId}` },
    { label: "Tokens", href: `/worlds/${worldId}/tokens` },
    { label: "Usage", href: `/worlds/${worldId}/usage` },
    { label: "Billing", href: `/worlds/${worldId}/billing` },
  ];

  function copyWorldId() {
    navigator.clipboard.writeText(worldId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading)
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  if (error)
    return (
      <AppShell>
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="size-5 text-destructive shrink-0" />
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  if (!world)
    return (
      <AppShell>
        <p className="text-muted-foreground">World not found.</p>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{world.displayName}</h1>
            <button
              onClick={copyWorldId}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-1"
            >
              {world.worldId}
              {copied ? (
                <Check className="size-3 text-green-400" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            Delete
          </Button>
        </div>
        <NavTabs tabs={tabs} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">State</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={stateVariant[world.state] ?? "secondary"}>
                {world.state}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Region</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{world.region}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Backend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{world.backend}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {world.createTime
                  ? new Date(world.createTime).toLocaleString()
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {world.updateTime
                  ? new Date(world.updateTime).toLocaleString()
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
        <DeleteWorldDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          worldId={worldId}
          onDeleted={() => router.push("/worlds")}
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
