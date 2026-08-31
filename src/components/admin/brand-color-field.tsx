"use client";

import { useState } from "react";

function foregroundFor(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150
    ? "#171326"
    : "#ffffff";
}

export function BrandColorField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  const [color, setColor] = useState(value);

  function preview(nextColor: string) {
    setColor(nextColor);
    document.documentElement.style.setProperty("--brand-primary", nextColor);
    document.documentElement.style.setProperty(
      "--brand-primary-foreground",
      foregroundFor(nextColor),
    );
  }

  return (
    <label className="text-sm font-semibold sm:col-span-2">
      {label}
      <div className="mt-2 flex items-center gap-3 rounded-xl border bg-background p-3">
        <input
          name={name}
          type="color"
          value={color}
          onChange={(event) => preview(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border bg-transparent p-1"
        />
        <code className="text-sm font-semibold uppercase">{color}</code>
      </div>
      <p className="mt-2 text-xs font-normal text-muted-foreground">
        Previewed immediately. Save configuration to apply it permanently.
      </p>
    </label>
  );
}
