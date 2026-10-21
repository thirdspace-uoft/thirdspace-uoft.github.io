"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMAGEKIT_PRIVATE_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY ?? "";
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

/** ImageKit free-plan upload limits. */
const MAX_BYTES = { image: 25 * 1024 * 1024, video: 100 * 1024 * 1024 } as const;

export type UploadKind = "image" | "video";

interface ImageUploaderProps {
  currentPath: string;
  folder: string;
  onUpload: (path: string, kind: UploadKind) => void;
  onDelete?: () => Promise<void>;
  /** Also accept video files (mp4, webm, mov). Off by default. */
  allowVideo?: boolean;
}

export function ImageUploader({ currentPath, folder, onUpload, onDelete, allowVideo = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "deleting" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleFile(file: File) {
    const kind: UploadKind | null = file.type.startsWith("image/")
      ? "image"
      : allowVideo && file.type.startsWith("video/")
        ? "video"
        : null;
    if (!kind) {
      setStatus("error");
      setMsg(allowVideo ? "Only image or video files are supported" : "Only image files are supported");
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      setStatus("error");
      setMsg(`Too large: ${kind}s can be up to ${MAX_BYTES[kind] / 1024 / 1024} MB`);
      return;
    }

    if (!IMAGEKIT_PRIVATE_KEY) {
      setStatus("error");
      setMsg("NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY not set in .env");
      return;
    }

    setStatus("uploading");
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("folder", folder);
      formData.append("useUniqueFileName", "true");

      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(IMAGEKIT_PRIVATE_KEY + ":"),
        },
        body: formData,
      });
      const data = await res.json();
      console.log("ImageKit upload response:", res.status, data);

      if (!res.ok) {
        setStatus("error");
        setMsg(data.message ?? "Upload failed");
        return;
      }

      const uploadedPath = "/" + data.filePath;
      onUpload(uploadedPath, kind);
      setStatus("success");
      setMsg(`Uploaded: ${data.name}`);
    } catch {
      setStatus("error");
      setMsg("Network error — check console");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setStatus("deleting");
    setMsg("");
    try {
      await onDelete();
      setStatus("success");
      setMsg("Deleted from ImageKit");
    } catch (e: unknown) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={allowVideo ? "image/*,video/*" : "image/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {currentPath && onDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "deleting" || status === "uploading"}
          onClick={handleDelete}
          className="shrink-0 text-xs gap-1.5 text-destructive hover:text-destructive"
          title="Delete from ImageKit"
        >
          {status === "deleting" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {status === "deleting" ? "Deleting..." : "Delete"}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === "uploading" || status === "deleting"}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 text-xs gap-1.5"
      >
        {status === "uploading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {status === "uploading" ? "Uploading..." : "Upload"}
      </Button>
      {status === "success" && <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />}
      {status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
      {msg && <span className="text-[12px] font-mono text-muted-foreground truncate max-w-[200px]">{msg}</span>}
    </div>
  );
}
