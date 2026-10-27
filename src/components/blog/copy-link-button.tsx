"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export function CopyLinkButton({ url, label, copiedLabel, className }: { url: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (permissions, old browser): the address bar still has the URL.
        }
      }}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <LinkIcon className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
