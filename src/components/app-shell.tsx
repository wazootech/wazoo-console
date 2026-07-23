"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/worlds"
              className="group flex items-center gap-2 font-semibold"
            >
              <img src="/wazoo.svg" alt="" className="size-7 logo-spin" />
              <span className="hidden sm:inline">Wazoo Console</span>
            </Link>
            <nav
              className="hidden sm:flex items-center gap-4"
              aria-label="Main"
            >
              <Link
                href="/worlds"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Worlds
              </Link>
              <Link
                href="/tokens"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                API Tokens
              </Link>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
