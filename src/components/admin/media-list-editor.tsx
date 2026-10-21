"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";
import { Input } from "@/components/ui/input";
import { detectMediaType, type ResearchMedia, type ResearchMediaType } from "@/lib/research";

const TYPES: { value: ResearchMediaType; label: string }[] = [
  { value: "image", label: "Image / GIF" },
  { value: "video", label: "Video (ImageKit)" },
  { value: "youtube", label: "YouTube" },
];

const PLACEHOLDER: Record<ResearchMediaType, string> = {
  image: "/research/topic/figure.gif",
  video: "/research/topic/clip.mp4",
  youtube: "https://www.youtube.com/watch?v=…",
};

/**
 * Edits a list of research media: type, path/URL (typing one auto-detects the
 * type), alt text, upload (images, GIFs and videos go to ImageKit), remove.
 * `single` limits it to one entry (a topic's card cover).
 */
export function MediaListEditor({
  media,
  onChange,
  folder,
  onDeleteFile,
  single = false,
}: {
  media: ResearchMedia[];
  onChange: (media: ResearchMedia[]) => void;
  folder: string;
  onDeleteFile: (path: string) => Promise<void>;
  single?: boolean;
}) {
  const update = (i: number, patch: Partial<ResearchMedia>) =>
    onChange(media.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-2">
      {media.map((m, i) => {
        const type = m.type ?? detectMediaType(m.path);
        return (
          <div key={i} className="grid grid-cols-1 gap-2 rounded border border-border/70 bg-background p-2 lg:grid-cols-[150px_1fr_1fr_auto]">
            <select
              value={type}
              onChange={(e) => update(i, { type: e.target.value as ResearchMediaType })}
              className="h-8 rounded border border-input bg-background px-2 text-xs"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="flex min-w-0 gap-2">
              <Input
                value={m.path ?? ""}
                onChange={(e) => update(i, { path: e.target.value, type: detectMediaType(e.target.value) })}
                placeholder={PLACEHOLDER[type]}
                className="h-8 flex-1 font-mono text-xs"
              />
              {type !== "youtube" && (
                <ImageUploader
                  currentPath={m.path ?? ""}
                  folder={folder}
                  allowVideo
                  onUpload={(path, kind) => update(i, { path, type: kind })}
                  onDelete={() => onDeleteFile(m.path ?? "")}
                />
              )}
            </div>
            <Input
              value={m.alt ?? ""}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder={type === "youtube" ? "Video title (screen readers)" : "Alt text"}
              className="h-8 text-xs"
            />
            <Button size="xs" variant="ghost" onClick={() => onChange(media.filter((_, j) => j !== i))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
      {(!single || media.length === 0) && (
        <Button size="xs" variant="outline" onClick={() => onChange([...media, { type: "image", path: "", alt: "" }])}>
          <Plus className="h-3 w-3" /> {single ? "Add cover" : "Add image / video"}
        </Button>
      )}
    </div>
  );
}
