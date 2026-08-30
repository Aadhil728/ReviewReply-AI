"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clipboard, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  reviewText: string;
  rating: number;
  tone: string;
  language: string;
  generatedResponse: string;
  finalResponse: string | null;
  createdAt: string;
};

export function HistoryList({
  items: initialItems,
  referenceTime,
}: {
  items: Item[];
  referenceTime: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("ALL");
  const [language, setLanguage] = useState("ALL");
  const [tone, setTone] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const languages = useMemo(
    () => [...new Set(items.map((item) => item.language))].sort(),
    [items],
  );
  const tones = useMemo(
    () => [...new Set(items.map((item) => item.tone))].sort(),
    [items],
  );
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery =
          `${item.reviewText} ${item.finalResponse ?? item.generatedResponse}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const ageDays =
          (new Date(referenceTime).getTime() -
            new Date(item.createdAt).getTime()) /
          86_400_000;
        const matchesDate = dateRange === "ALL" || ageDays <= Number(dateRange);
        return (
          matchesQuery &&
          matchesDate &&
          (rating === "ALL" || item.rating === Number(rating)) &&
          (language === "ALL" || item.language === language) &&
          (tone === "ALL" || item.tone === tone)
        );
      }),
    [items, query, rating, language, tone, dateRange, referenceTime],
  );

  async function remove(item: Item) {
    if (!window.confirm("Delete this history item? This cannot be undone."))
      return;
    const response = await fetch(`/api/history/${item.id}`, {
      method: "DELETE",
    });
    if (!response.ok)
      return toast.error("The history item could not be deleted.");
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    toast.success("History item deleted");
  }

  return (
    <>
      <div>
        <p className="eyebrow">Response history</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Your recent replies.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Search, inspect, copy, and remove responses generated for your
          business.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-12 text-center">
          <h2 className="font-bold">No replies yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate your first customer response and it will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Generate reply</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(4,150px)]">
            <label className="relative">
              <span className="sr-only">Search history</span>
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reviews and replies"
                className="h-10 w-full rounded-xl border bg-card pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <Filter
              label="Rating"
              value={rating}
              onChange={setRating}
              options={["ALL", "1", "2", "3", "4", "5"]}
            />
            <Filter
              label="Language"
              value={language}
              onChange={setLanguage}
              options={["ALL", ...languages]}
            />
            <Filter
              label="Tone"
              value={tone}
              onChange={setTone}
              options={["ALL", ...tones]}
            />
            <Filter
              label="Date"
              value={dateRange}
              onChange={setDateRange}
              options={["ALL", "1", "7", "30"]}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 space-y-3">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex text-warning">
                    <Star className="mr-1 size-3 fill-current" />
                    {item.rating}
                  </span>
                  <span aria-hidden>•</span>
                  <span>{item.tone.replaceAll("_", " ")}</span>
                  <span aria-hidden>•</span>
                  <span>{item.language.replaceAll("_", " ")}</span>
                  <span aria-hidden>•</span>
                  <time>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(item.createdAt))}
                  </time>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold">
                    View review and reply
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                    {item.reviewText}
                  </p>
                  <div className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-sm leading-6">
                    {item.finalResponse ?? item.generatedResponse}
                  </div>
                </details>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        item.finalResponse ?? item.generatedResponse,
                      );
                      toast.success("Reply copied");
                    }}
                  >
                    <Clipboard className="size-4" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(item)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="sr-only">Filter by {label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL"
              ? `All ${label.toLowerCase()}s`
              : option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
