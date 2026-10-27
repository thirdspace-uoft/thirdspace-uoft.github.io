"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import type { VideoMedia } from "@/lib/blog-resources";

/**
 * A "lite" embed: the thumbnail and a play button until the reader presses
 * play, then the real player. No YouTube or Vimeo request happens before that
 * click, which keeps posts fast and free of third-party cookies.
 * ImageKit files use a native <video> that downloads nothing until played.
 */
export function VideoPlayer({ media, priority = false }: { media: VideoMedia; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const frame = "relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted";

  if (media.videoSrc) {
    return (
      <div className={frame}>
        <video
          controls
          preload="none"
          poster={media.poster}
          src={media.videoSrc}
          aria-label={media.title}
          className="absolute inset-0 size-full bg-black object-contain"
        />
      </div>
    );
  }

  if (playing && media.embedSrc) {
    return (
      <div className={frame}>
        <iframe
          src={media.embedSrc}
          title={media.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    );
  }

  const cover = (
    <>
      {media.poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
        <img
          src={media.poster}
          alt=""
          width={480}
          height={270}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span aria-hidden className="absolute inset-0 bg-muted" />
      )}
      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-background/95 text-primary shadow-sm ring-1 ring-border transition-transform group-hover:scale-105 sm:size-16">
          <Play className="ml-0.5 size-6 fill-current sm:size-7" />
        </span>
      </span>
      {media.duration && (
        <span className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-xs text-white">
          {media.duration}
        </span>
      )}
    </>
  );

  const control =
    "group block size-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className={frame}>
      {media.embedSrc ? (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${media.title}`} className={control}>
          {cover}
        </button>
      ) : (
        // A host we can't embed: the tile links out instead.
        <a href={media.url} target="_blank" rel="noopener noreferrer" aria-label={`Watch video: ${media.title}`} className={control}>
          {cover}
        </a>
      )}
    </div>
  );
}
