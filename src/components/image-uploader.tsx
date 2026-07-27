"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMAGEKIT_PUBLIC_KEY = "public_ceZcPfhgVnUzLdYrWwlIHNbe0eI=";
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

interface ImageUploaderProps {
  currentPath: string;
  folder: string;
  onUpload: (path: string) => void;
}

export function ImageUploader({ currentPath, folder, onUpload }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
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

  return (
    <div className="flex items-center gap-2">
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === "uploading"}
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
