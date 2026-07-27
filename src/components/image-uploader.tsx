"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? "";
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

interface ImageUploaderProps {
  currentPath: string;
  folder: string;
  onUpload: (path: string) => void;
  onDelete?: () => Promise<void>;
}

export function ImageUploader({ currentPath, folder, onUpload, onDelete }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "deleting" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMsg("Only image files are supported");
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
      formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);

      const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
      const data = await res.json();
      console.log("ImageKit upload response:", res.status, data);

      if (!res.ok) {
        if (data.message?.includes("unauthorized") || data.message?.includes("signature") || data.message?.includes("auth")) {
          setStatus("error");
          setMsg("Unsigned uploads not enabled. Enable in ImageKit Dashboard → Settings → Allow unsigned uploads.");
        } else {
          setStatus("error");
          setMsg(data.message ?? "Upload failed");
        }
        return;
      }

      const uploadedPath = "/" + data.filePath;
      onUpload(uploadedPath);
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
        accept="image/*"
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
      {msg && <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{msg}</span>}
    </div>
  );
}
