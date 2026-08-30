"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error", error.digest);
  }, [error]);
  return (
    <main className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-bold">We couldn’t load this page.</h1>
        <p className="mt-3 text-muted-foreground">
          Try again. If the problem continues, share error reference{" "}
          {error.digest ?? "unavailable"} with the administrator.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
