"use client";

import { useAuth } from "@/lib/auth";
import { LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 text-sm text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <User className="size-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://docs.wazoo.dev/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ShieldCheck className="size-4" />
            Do Not Sell or Share My Personal Information
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
