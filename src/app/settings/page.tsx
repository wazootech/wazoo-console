"use client";

import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getHealth().then((r) => setApiOk(!r.error));
  }, [token]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

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
            {user?.displayName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Display Name
                </span>
                <span className="text-sm">{user.displayName}</span>
              </div>
            )}
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

        <Button
          variant="destructive"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
