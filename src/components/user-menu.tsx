"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <User className="size-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {user.email}
        </span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-card p-1 shadow-lg">
          <div className="px-3 py-2 text-sm text-muted-foreground truncate">
            {user.email}
          </div>
          <div className="h-px bg-border my-1" />
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent",
            )}
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
          >
            <Settings className="size-4" />
            Settings
          </button>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent",
            )}
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
