"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";
import { Loader2, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !token) {
      router.push("/sign-in");
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

  const navItems = [
    { label: "Worlds", href: "/worlds" },
    { label: "Tokens", href: "/tokens" },
    { label: "Docs", href: "https://docs.wazoo.dev", external: true },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/worlds"
              className="group flex items-center gap-2 font-semibold shrink-0"
            >
              <img src="/wazoo.svg" alt="" className="size-7 logo-spin" />
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">Wazoo Console</span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono font-semibold tracking-wider text-primary border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded shrink-0"
                >
                  BETA
                </Badge>
              </span>
            </Link>
            <nav
              className="hidden sm:flex items-center gap-2"
              aria-label="Main"
            >
              {navItems.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium rounded-md border border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-1"
                    >
                      {item.label}
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  );
                }
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md border transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-border bg-accent text-foreground font-semibold"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
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
