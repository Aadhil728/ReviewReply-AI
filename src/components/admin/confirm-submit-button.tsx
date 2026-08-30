"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  name,
  value,
  children,
  message,
  variant = "secondary",
}: {
  name: string;
  value: string;
  children: React.ReactNode;
  message: string;
  variant?: "secondary" | "ghost" | "destructive";
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      name={name}
      value={value}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
