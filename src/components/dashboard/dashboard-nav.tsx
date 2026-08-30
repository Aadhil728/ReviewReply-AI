"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Clock3, CreditCard, Gauge, PenLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  ["/dashboard", PenLine, "Generate Reply"],
  ["/dashboard/history", Clock3, "History"],
  ["/dashboard/business", Building2, "Business Profile"],
  ["/dashboard/usage", Gauge, "Usage"],
  ["/dashboard/upgrade", CreditCard, "Plans & Upgrade"],
  ["/dashboard/settings", Settings, "Settings"],
] as const;

function isActiveRoute(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname.startsWith(`${href}/`) || pathname === href;
}

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return links.map(([href, Icon, label]) => {
    const active = isActiveRoute(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mobile ? "py-3" : "py-2.5",
          active
            ? "bg-accent text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("size-4", active && "text-primary")} />
        {label}
      </Link>
    );
  });
}
