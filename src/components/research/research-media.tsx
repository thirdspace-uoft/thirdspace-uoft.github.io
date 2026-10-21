"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { cn, getImageUrl } from "@/lib/utils";
import {
  mediaType,
  videoPoster,
  youtubeEmbedUrl,
  type ResearchContent,
  type ResearchMedia,
} from "@/lib/research";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Shown while something has no media yet: the site's dot grid with a faint mark. */
export function ResearchPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted/60 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]",
        className,
      )}
    >
      <Sparkles className="size-8 text-primary/40" />
    </div>
  );
}

/**
 * One visual. `layout="fill"` (default) fills a relatively positioned parent;
 * `layout="natural"` takes the full width at the file's own aspect ratio, so a
 * diagram or tall photo isn't cropped (YouTube, which has no intrinsic size,
 * gets a 16:9 frame).
 *
 * - image / GIF: GIFs animate on their own.
 * - video: plays like a GIF — muted, looping, inline — with an ImageKit poster
 *   frame. With reduced motion it waits for the reader and shows controls.
 * - youtube: privacy-enhanced embed, loaded lazily.
 */
export function MediaView({
  media,
  sizes,
  priority,
  fit = "cover",
  layout = "fill",
}: {
  media: ResearchMedia;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  layout?: "fill" | "natural";
}) {
  const natural = layout === "natural";
  const reducedMotion = usePrefersReducedMotion();
  const path = media.path ?? "";
  const type = mediaType(media);
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  if (type === "youtube") {
    const src = youtubeEmbedUrl(path);
    if (!src) return <ResearchPlaceholder />;
    const frame = (
      <iframe
        src={src}
        title={media.alt ?? ""}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    );
    return natural ? <div className="relative aspect-video w-full">{frame}</div> : frame;
  }

  if (type === "video") {
    return (
      <video
        key={reducedMotion ? "still" : "play"}
        src={getImageUrl(path)}
        poster={videoPoster(path)}
        aria-label={media.alt ?? undefined}
        autoPlay={!reducedMotion}
        controls={reducedMotion}
        muted
        loop
        playsInline
        preload="metadata"
        className={natural ? "h-auto w-full" : cn("absolute inset-0 h-full w-full", fitClass)}
      />
    );
  }

  if (natural) {
    // width/height only seed the layout box; CSS lets the file's own ratio win.
    return (
      <Image
        src={getImageUrl(path)}
        alt={media.alt ?? ""}
        width={1600}
        height={1000}
        sizes={sizes}
        priority={priority}
        // Never wider than the file itself: paper figures are often ~500px and blur when stretched.
        className="mx-auto block h-auto w-auto max-w-full"
      />
    );
  }
  return <Image src={getImageUrl(path)} alt={media.alt ?? ""} fill sizes={sizes} priority={priority} className={fitClass} />;
}

/** Several visuals in one frame, with arrows, dots and ← / → keys. */
export function ResearchSlider({
  media,
  labels,
  sizes,
}: {
  media: ResearchMedia[];
  labels?: ResearchContent["labels"];
  sizes: string;
}) {
  const [index, setIndex] = useState(0);
  if (media.length === 0) return <ResearchPlaceholder />;
  const go = (next: number) => setIndex((next + media.length) % media.length);

  return (
    <div
      className="relative h-full w-full"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <MediaView key={index} media={media[index]} sizes={sizes} fit="contain" />
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={labels?.previous}
            className="absolute left-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-xs transition-colors hover:bg-card"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={labels?.next}
            className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-xs transition-colors hover:bg-card"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-foreground/30 px-2 py-1">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={labels?.goToSlide?.replace("{n}", String(i + 1))}
                aria-current={i === index}
                className={cn("size-2 rounded-full transition-colors", i === index ? "bg-white" : "bg-white/50 hover:bg-white/80")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
