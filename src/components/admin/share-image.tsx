"use client";

import { useEffect, useRef, useState } from "react";
import { encode } from "uqr";
import { Download, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  bookingUrl,
  formatDateRange,
  guestNames,
  resolveAttendees,
  type Conference,
  type FindUsContent,
  type Person,
} from "@/lib/find-us";
import { cn, getAssetPath, getImageUrl } from "@/lib/utils";

/**
 * Builds the "Find us at <conference>" image for LinkedIn posts (1080×1080) and
 * stories (1080×1920) in the browser: site colours and fonts, the logo, the
 * attendees' photos, and a QR code to the booking page. ImageKit serves photos
 * with CORS, so the canvas stays exportable.
 */

type Format = "square" | "story";
const SIZES: Record<Format, { w: number; h: number }> = { square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };

type Theme = Record<"background" | "foreground" | "card" | "primary" | "primaryForeground" | "muted" | "mutedForeground" | "border", string>;

/** The site's design tokens, resolved by the browser (oklch is fine for canvas). */
function readTheme(): Theme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    background: v("--background", "#fdfbfb"),
    foreground: v("--foreground", "#1a0e0e"),
    card: v("--card", "#ffffff"),
    primary: v("--primary", "#b21f2d"),
    primaryForeground: v("--primary-foreground", "#ffffff"),
    muted: v("--muted", "#f9f1f1"),
    mutedForeground: v("--muted-foreground", "#695959"),
    border: v("--border", "#ebe2e2"),
  };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Square-cropped, face-focused thumbnail from ImageKit. */
const avatarSrc = (path: string) => `${getImageUrl(path)}?tr=w-320,h-320,fo-face`;

/** Splits text into lines that fit `maxWidth`, at most `maxLines` (last one ellipsised). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, theme: Theme) {
  const { data } = encode(text, { ecc: "M", border: 0 });
  const n = data.length;
  const quiet = 2;
  const cell = size / (n + quiet * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = theme.foreground;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r][c]) ctx.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  name: string,
  cx: number,
  cy: number,
  radius: number,
  theme: Theme,
  sans: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = theme.muted;
  ctx.fill();
  ctx.clip();
  if (img) {
    // object-fit: cover
    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    const initials = name.split(/\s+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((w) => w[0]).join("");
    ctx.fillStyle = theme.mutedForeground;
    ctx.font = `600 ${Math.round(radius * 0.7)}px ${sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, cx, cy);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.card;
  ctx.stroke();
}

type Assets = {
  logo: HTMLImageElement | null;
  avatars: { person: Person; img: HTMLImageElement | null }[];
  guests: string[];
};

type DrawInput = {
  format: Format;
  conference: Conference;
  findUs: FindUsContent;
  brandLine: string;
  qrTarget: string;
  assets: Assets;
};

function draw(canvas: HTMLCanvasElement, { format, conference, findUs, brandLine, qrTarget, assets }: DrawInput) {
  const { w: W, h: H } = SIZES[format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const theme = readTheme();
  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  const labels = findUs.labels ?? {};
  const story = format === "story";
  const P = story ? 96 : 84;
  const contentW = W - P * 2;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Background, brand bar, logo.
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, 0, W, story ? 22 : 18);
  // The booking card is pinned to the bottom; everything above has to fit over it.
  const footerH = story ? 110 : 76;
  const cardH = story ? 560 : 260;
  const cardY = H - footerH - cardH;

  let y = story ? 120 : 72;
  if (assets.logo) {
    // long_logo.webp carries transparent padding; draw it a little wider than it reads.
    const lw = story ? 380 : 270;
    const lh = (assets.logo.height / assets.logo.width) * lw;
    ctx.drawImage(assets.logo, P - lw * 0.075, y - lh * 0.18, lw, lh);
    y += lh * 0.72;
  }

  // Eyebrow, name, full name, dates · place.
  y += story ? 110 : 48;
  ctx.fillStyle = theme.mutedForeground;
  ctx.font = `600 ${story ? 34 : 26}px ${mono}`;
  ctx.letterSpacing = "6px";
  ctx.fillText((labels.shareEyebrow ?? "").toUpperCase(), P, y);
  ctx.letterSpacing = "0px";

  const nameSize = story ? 136 : 96;
  ctx.font = `800 ${nameSize}px ${sans}`;
  ctx.fillStyle = theme.foreground;
  for (const line of wrap(ctx, conference.name ?? "", contentW, 2)) {
    y += nameSize * 1.05;
    ctx.fillText(line, P, y);
  }
  if (conference.fullName) {
    const fs = story ? 38 : 28;
    ctx.font = `400 ${fs}px ${sans}`;
    ctx.fillStyle = theme.mutedForeground;
    y += story ? 26 : 10;
    for (const line of wrap(ctx, conference.fullName, contentW, story ? 2 : 1)) {
      y += fs * 1.3;
      ctx.fillText(line, P, y);
    }
  }
  const when = [formatDateRange(conference.startDate, conference.endDate), conference.location].filter(Boolean).join("  ·  ");
  if (when) {
    const ws = story ? 46 : 36;
    ctx.font = `700 ${ws}px ${sans}`;
    ctx.fillStyle = theme.primary;
    y += story ? 40 : 22;
    for (const line of wrap(ctx, when, contentW, story ? 2 : 1)) {
      y += ws * 1.25;
      ctx.fillText(line, P, y);
    }
  }

  // Attendees: photo circles with first names.
  const people = assets.avatars;
  const extraGuests = assets.guests;
  if (people.length + extraGuests.length > 0) {
    y += story ? 90 : 44;
    ctx.fillStyle = theme.mutedForeground;
    ctx.font = `600 ${story ? 30 : 22}px ${mono}`;
    ctx.letterSpacing = "5px";
    ctx.fillText((labels.attendees ?? "").toUpperCase(), P, y);
    ctx.letterSpacing = "0px";

    const perRow = story ? 4 : 6;
    const maxShown = story ? 8 : 6;
    const shown = people.slice(0, maxShown);
    const extra = people.length - shown.length + extraGuests.length;
    const nameSize = story ? 30 : 22;
    const rowsNeeded = Math.max(1, Math.ceil(shown.length / perRow));
    const extraLine = extra > 0 ? nameSize * 1.6 : 0;
    // Shrink the photos until every row (photo + name) fits above the booking card.
    const room = cardY - 28 - (y + 34) - extraLine;
    const fitRadius = (room / rowsNeeded - nameSize * 2.6) / 2;
    const radius = Math.max(story ? 60 : 34, Math.min(story ? 92 : 62, fitRadius));
    const gap = perRow > 1 ? (contentW - perRow * radius * 2) / (perRow - 1) : 0;
    shown.forEach(({ person, img }, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const cx = P + radius + col * (radius * 2 + gap);
      const cy = y + 34 + radius + row * (radius * 2 + nameSize * 2.6);
      drawAvatar(ctx, img, person.name, cx, cy, radius, theme, sans);
      ctx.font = `600 ${nameSize}px ${sans}`;
      ctx.fillStyle = theme.foreground;
      ctx.textAlign = "center";
      const first = person.name.split(/\s+/).filter((w) => !/\.$/.test(w))[0] ?? person.name;
      ctx.fillText(first, cx, cy + radius + nameSize * 1.35);
      ctx.textAlign = "left";
    });
    const rows = Math.max(1, Math.ceil(shown.length / perRow));
    y += 34 + rows * (radius * 2 + nameSize * 2.6);
    if (extra > 0) {
      ctx.font = `600 ${nameSize}px ${sans}`;
      ctx.fillStyle = theme.mutedForeground;
      const names = extraGuests.length && shown.length === people.length ? extraGuests.join(", ") : `+${extra}`;
      ctx.fillText(wrap(ctx, names, contentW, 1)[0] ?? "", P, y);
      y += nameSize * 1.4;
    }
  }

  // Booking card with QR, pinned to the bottom.
  roundRect(ctx, P, cardY, contentW, cardH, story ? 36 : 28);
  ctx.fillStyle = theme.card;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  const short = qrTarget.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (story) {
    const q = 300;
    drawQr(ctx, qrTarget, W / 2 - q / 2, cardY + 48, q, theme);
    ctx.textAlign = "center";
    ctx.fillStyle = theme.foreground;
    ctx.font = `800 48px ${sans}`;
    ctx.fillText(labels.shareCta ?? "", W / 2, cardY + 48 + q + 78);
    ctx.fillStyle = theme.mutedForeground;
    ctx.font = `400 32px ${sans}`;
    ctx.fillText(labels.shareScan ?? "", W / 2, cardY + 48 + q + 124);
    ctx.fillStyle = theme.primary;
    ctx.font = `600 28px ${mono}`;
    ctx.fillText(wrap(ctx, short, contentW - 80, 1)[0] ?? "", W / 2, cardY + 48 + q + 180);
    ctx.textAlign = "left";
  } else {
    const q = cardH - 56;
    const qx = P + contentW - 28 - q;
    drawQr(ctx, qrTarget, qx, cardY + 28, q, theme);
    const tx = P + 40;
    const tw = qx - tx - 32;
    ctx.fillStyle = theme.foreground;
    ctx.font = `800 48px ${sans}`;
    let ty = cardY + 92;
    for (const line of wrap(ctx, labels.shareCta ?? "", tw, 2)) {
      ctx.fillText(line, tx, ty);
      ty += 56;
    }
    ctx.fillStyle = theme.mutedForeground;
    ctx.font = `400 28px ${sans}`;
    ctx.fillText(labels.shareScan ?? "", tx, ty + 8);
    ctx.fillStyle = theme.primary;
    ctx.font = `600 24px ${mono}`;
    ctx.fillText(wrap(ctx, short, tw, 1)[0] ?? "", tx, cardY + cardH - 40);
  }

  // Footer brand line.
  ctx.fillStyle = theme.mutedForeground;
  ctx.font = `500 ${story ? 30 : 24}px ${sans}`;
  ctx.fillText(brandLine, P, H - (story ? 46 : 34));
}

export function ShareImageDialog({
  conference,
  findUs,
  people,
  brandLine,
  open,
  onOpenChange,
}: {
  conference: Conference;
  findUs: FindUsContent;
  people: Person[];
  brandLine: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>("square");
  const [status, setStatus] = useState<"rendering" | "ready" | "error">("rendering");
  const qrTarget =
    bookingUrl(conference, findUs) ||
    (typeof window !== "undefined" ? `${window.location.origin}${getAssetPath("/contact")}#find-us` : "");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.ready;
        const attendees = resolveAttendees(conference, people);
        const [logo, ...imgs] = await Promise.all([
          loadImage(getAssetPath("/long_logo.webp")),
          ...attendees.map((p) => (p.imagePath ? loadImage(avatarSrc(p.imagePath)) : Promise.resolve(null))),
        ]);
        if (cancelled || !canvasRef.current) return;
        draw(canvasRef.current, {
          format,
          conference,
          findUs,
          brandLine,
          qrTarget,
          assets: { logo, avatars: attendees.map((person, i) => ({ person, img: imgs[i] })), guests: guestNames(conference) },
        });
        setStatus("ready");
      } catch (err) {
        console.error("Share image failed", err);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, format, conference, findUs, people, brandLine, qrTarget]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thirdspace-${conference.slug || "conference"}-${format}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  };

  const pick = (next: Format) => {
    if (next === format) return;
    setStatus("rendering");
    setFormat(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <DialogTitle className="text-base font-bold">Share image — {conference.name || "Untitled conference"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              QR code opens: <span className="font-mono break-all">{qrTarget || "—"}</span>
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_200px]">
          <div className="relative flex items-center justify-center rounded-lg border border-border bg-muted/40 p-3">
            <canvas
              ref={canvasRef}
              className={cn("h-auto max-h-[70vh] w-auto max-w-full rounded shadow-sm", status !== "ready" && "opacity-40")}
            />
            {status === "rendering" && <Loader2 className="absolute size-6 animate-spin text-muted-foreground" />}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[12px] font-mono uppercase text-muted-foreground">Format</p>
              <div className="grid gap-2">
                {(
                  [
                    ["square", "LinkedIn post · 1080×1080"],
                    ["story", "Story · 1080×1920"],
                  ] as const
                ).map(([value, label]) => (
                  <Button key={value} size="sm" variant={format === value ? "default" : "outline"} onClick={() => pick(value)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={download} disabled={status !== "ready"}>
              <Download /> Download PNG
            </Button>
            {status === "error" && <p className="text-xs text-destructive">Could not render the image. Check the console.</p>}
            {!bookingUrl(conference, findUs) && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                No Calendly link is set (lab or conference), so the QR code points to the Find us section instead.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
