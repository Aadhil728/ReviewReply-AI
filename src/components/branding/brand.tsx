"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "./brand-provider";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-9", className)}
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="12" fill="url(#brand-gradient)" />
      <path
        d="M11 12.75A4.75 4.75 0 0 1 15.75 8h8.5A4.75 4.75 0 0 1 29 12.75v6.5A4.75 4.75 0 0 1 24.25 24H20l-5.7 4.44c-.84.65-2.05.06-2.05-1v-3.58A4.75 4.75 0 0 1 11 19.25v-6.5Z"
        fill="white"
        fillOpacity=".96"
      />
      <path
        d="m22.5 11.8.7 2.05 2.05.7-2.05.7-.7 2.05-.7-2.05-2.05-.7 2.05-.7.7-2.05Z"
        fill="#6D35E8"
      />
      <defs>
        <linearGradient
          id="brand-gradient"
          x1="4"
          y1="3"
          x2="35"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7957F2" />
          <stop offset="1" stopColor="#4C28C8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { productName } = useBrand();
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <LogoMark />
      <span
        className={compact ? "sr-only" : "text-[17px] font-bold tracking-tight"}
      >
        {productName}
      </span>
    </Link>
  );
}
