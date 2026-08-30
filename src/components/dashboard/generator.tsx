"use client";

import { useRef, useState } from "react";
import {
  Check,
  Clipboard,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tones = [
  ["WARM_PROFESSIONAL", "Warm & Professional"],
  ["PROFESSIONAL", "Professional"],
  ["FRIENDLY", "Friendly"],
  ["WARM", "Warm"],
  ["CONCISE", "Concise"],
  ["EMPATHETIC", "Empathetic"],
  ["LUXURY", "Luxury"],
  ["CASUAL", "Casual"],
];
const languages = [
  ["AUTO", "Auto detect"],
  ["ENGLISH", "English"],
  ["ARABIC", "Arabic"],
  ["SPANISH", "Spanish"],
  ["FRENCH", "French"],
  ["GERMAN", "German"],
  ["ITALIAN", "Italian"],
  ["PORTUGUESE", "Portuguese"],
  ["HINDI", "Hindi"],
  ["TAMIL", "Tamil"],
  ["SINHALA", "Sinhala"],
];

export function Generator({
  defaultLength = "MEDIUM",
  defaultLanguage = "AUTO",
  businesses,
}: {
  defaultLength?: string;
  defaultLanguage?: string;
  businesses: { id: string; name: string }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(3);
  const [tone, setTone] = useState("WARM_PROFESSIONAL");
  const [length, setLength] = useState(defaultLength);
  const [language, setLanguage] = useState(defaultLanguage);
  const [reply, setReply] = useState("");
  const [generationId, setGenerationId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const retryRequestKey = useRef<string | undefined>(undefined);

  async function generate(action?: string) {
    if (reviewText.trim().length < 3) {
      toast.error("Please enter a customer review before generating.");
      return;
    }
    setPending(true);
    try {
      const requestKey = retryRequestKey.current ?? crypto.randomUUID();
      retryRequestKey.current = requestKey;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          requestKey,
          reviewText,
          rating,
          tone,
          responseLength: length,
          language,
          action: action ?? "GENERATE",
          existingResponse: reply,
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        id?: string;
        error?: string;
        used?: number;
        total?: number;
        resetAt?: string;
      };
      retryRequestKey.current = undefined;
      if (!response.ok || !data.reply) {
        toast.error(
          data.error ?? "Couldn't generate a reply. Please try again.",
        );
        return;
      }
      setReply(data.reply);
      setGenerationId(data.id);
      if (typeof data.used === "number" && typeof data.total === "number")
        window.dispatchEvent(
          new CustomEvent("reviewreply:usage", { detail: data }),
        );
      toast.success(action ? "Reply updated" : "Thoughtful reply ready");
    } catch {
      toast.error(
        "The request could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function save() {
    if (!generationId || !reply) return;
    const response = await fetch(`/api/history/${generationId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ finalResponse: reply }),
    });
    if (response.ok) toast.success("Edited reply saved");
    else toast.error("We couldn't save your edit.");
  }

  async function copy() {
    if (!reply) return;
    if (generationId) await save();
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    toast.success("Reply copied");
    setTimeout(() => setCopied(false), 1600);
  }

  function clearWorkspace() {
    setReviewText("");
    setRating(3);
    setTone("WARM_PROFESSIONAL");
    setLength(defaultLength);
    setLanguage(defaultLanguage);
    setReply("");
    setGenerationId(undefined);
    setCopied(false);
    toast.success("Ready for a new review");
  }

  return (
    <>
      <div className="mb-7">
        <p className="eyebrow">Review generator</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Write the right response.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add the review, shape the tone, and make the final words your own.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          {businesses.length > 1 ? (
            <label className="mb-5 block text-sm font-bold">
              Business
              <select
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Customer review</h2>
            <span className="text-xs text-muted-foreground">
              {reviewText.length} / 3,000
            </span>
          </div>
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            maxLength={3000}
            rows={8}
            placeholder="Paste the customer's review here..."
            className="mt-4 w-full resize-none rounded-xl border bg-background p-4 text-[15px] leading-7 outline-none transition focus:ring-2 focus:ring-ring"
          />
          <fieldset className="mt-6">
            <legend className="text-sm font-bold">Star rating</legend>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-label={`${number} star${number > 1 ? "s" : ""}`}
                  onClick={() => setRating(number)}
                  className="rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={cn(
                      "size-7 transition",
                      number <= rating
                        ? "fill-warning text-warning"
                        : "text-border",
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="text-sm font-bold">Response tone</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {tones.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTone(value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    tone === value
                      ? "border-primary bg-accent text-primary"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select
              label="Response length"
              value={length}
              onChange={setLength}
              options={[
                ["SHORT", "Short"],
                ["MEDIUM", "Medium"],
                ["DETAILED", "Detailed"],
              ]}
            />
            <Select
              label="Language"
              value={language}
              onChange={setLanguage}
              options={languages}
            />
          </div>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => generate()}
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Writing a thoughtful response…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate reply
              </>
            )}
          </Button>
        </section>

        <section className="flex min-h-[590px] flex-col rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Generated reply</h2>
            {reply && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={clearWorkspace}>
                  <X className="size-4" />
                  Clear
                </Button>
                <Button variant="ghost" size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Clipboard className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>
          {reply ? (
            <>
              <textarea
                aria-label="Generated reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onBlur={() => void save()}
                className="mt-4 min-h-64 flex-1 resize-none rounded-xl border bg-background p-4 leading-7 outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["MAKE_SHORTER", "Make shorter"],
                  ["MAKE_FRIENDLIER", "Make friendlier"],
                  ["MAKE_MORE_PROFESSIONAL", "More professional"],
                  ["ADD_EMPATHY", "Add empathy"],
                ].map(([action, label]) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => generate(action)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => generate()}
                  disabled={pending}
                >
                  <RefreshCw className="size-4" />
                  Generate another
                </Button>
                <Button onClick={copy}>
                  <Clipboard className="size-4" />
                  Copy reply
                </Button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center py-20 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                  <Sparkles className="size-5" />
                </span>
                <h3 className="mt-5 font-bold">Your reply will appear here</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  Paste a review and choose your style. You can edit every word
                  before copying.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
