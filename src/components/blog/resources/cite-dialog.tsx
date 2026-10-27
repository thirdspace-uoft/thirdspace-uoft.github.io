"use client";

import { useState } from "react";
import { Check, Copy, Quote } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard blocked: the text is selectable below.
            }
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : `Copy ${label}`}</span>
        </button>
      </div>
      <pre tabIndex={0} className="mt-2 max-h-60 overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {text}
      </pre>
    </div>
  );
}

/** "Cite" button: BibTeX and APA for one paper, each with a copy button. */
export function CiteDialog({ title, bibtex, apa, buttonClassName }: { title: string; bibtex?: string; apa: string; buttonClassName: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={buttonClassName}>
          <Quote className="size-4" aria-hidden />
          Cite
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cite this paper</DialogTitle>
          <DialogDescription className="line-clamp-2">{title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {bibtex && <CopyBlock label="BibTeX" text={bibtex} />}
          <CopyBlock label="APA" text={apa} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
