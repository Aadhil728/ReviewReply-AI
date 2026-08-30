"use client";

import { useEffect, useState } from "react";

type UsageDetail = { used: number; total: number; resetAt?: string };

export function UsageMeter({
  initialUsed,
  initialTotal,
  compact = false,
}: {
  initialUsed: number;
  initialTotal: number;
  compact?: boolean;
}) {
  const [usage, setUsage] = useState({
    used: initialUsed,
    total: initialTotal,
  });
  useEffect(() => {
    function update(event: Event) {
      const detail = (event as CustomEvent<UsageDetail>).detail;
      if (detail) setUsage({ used: detail.used, total: detail.total });
    }
    window.addEventListener("reviewreply:usage", update);
    return () => window.removeEventListener("reviewreply:usage", update);
  }, []);
  const percent =
    usage.total > 0 ? Math.min(100, (usage.used / usage.total) * 100) : 0;
  return (
    <div
      className={
        compact ? "text-xs font-semibold" : "rounded-xl border bg-muted/45 p-3"
      }
    >
      <div className="flex justify-between text-xs font-semibold">
        <span>Monthly AI generations</span>
        <span>
          {usage.used} / {usage.total}
        </span>
      </div>
      {!compact && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
