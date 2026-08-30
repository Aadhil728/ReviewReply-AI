"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Landmark,
  Settings2,
  Users,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans & billing", icon: CreditCard },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: ReceiptText },
  { href: "/admin/bank-transfers", label: "Bank transfers", icon: Landmark },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/admin/settings", label: "Configuration", icon: Settings2 },
  { href: "/admin/audit", label: "Audit log", icon: Activity },
];

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <div className={cn("space-y-1", mobile && "p-2")}>
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
