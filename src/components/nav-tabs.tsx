"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
}

export function NavTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const normalizedPathname = pathname ? pathname.replace(/\/$/, "") : "";

  return (
    <nav aria-label="Tabs" className="flex gap-1 border-b border-border pb-0">
      {tabs.map((tab) => {
        const normalizedHref = tab.href.replace(/\/$/, "");
        const active = normalizedPathname === normalizedHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-3.5 py-2 text-sm font-medium rounded-t-md transition-all border-b-2 -mb-px outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active
                ? "border-primary text-primary bg-primary/10 shadow-[0_1px_8px_rgba(255,140,0,0.15)] font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-900/50",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
