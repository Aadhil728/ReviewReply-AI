"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BrandImageField({
  name,
  label,
  value,
  help,
  maxBytes,
}: {
  name: string;
  label: string;
  value: string;
  help: string;
  maxBytes: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(value);

  function select(file?: File) {
    if (!file) return;
    if (
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/x-icon",
        "image/vnd.microsoft.icon",
      ].includes(file.type)
    ) {
      toast.error("Use a PNG, JPG, WebP, or ICO image.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(
        `The image must be smaller than ${Math.round(maxBytes / 1024)} KB.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      <input type="hidden" name={name} value={image} />
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-card">
          {image ? (
            <Image
              src={image}
              alt={`${label} preview`}
              width={80}
              height={80}
              unoptimized
              className="size-full object-contain p-1"
            />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            {image ? "Replace image" : "Choose image"}
          </Button>
          {image ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setImage("");
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico"
        className="sr-only"
        onChange={(event) => select(event.target.files?.[0])}
      />
    </div>
  );
}
