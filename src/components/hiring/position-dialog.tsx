"use client";

import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore/lite";
import { CheckCircle2, Loader2, Mail, X } from "lucide-react";

import { ModeChip, PositionFacts } from "@/components/hiring/position-meta";
import { RichText } from "@/components/research/rich-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { liteDb } from "@/lib/firebase-lite";
import {
  APPLICATION_LIMITS,
  EMAIL_PATTERN,
  URL_PATTERN,
  isPastDeadline,
  listingContact,
  type HiringContent,
  type HiringListing,
} from "@/lib/hiring";

export function PositionDialog({
  listing,
  hiring,
  open,
  onOpenChange,
}: {
  listing?: HiringListing;
  hiring: HiringContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Keep the last listing while the dialog animates closed.
  const [shown, setShown] = React.useState(listing);
  if (listing && listing !== shown) setShown(listing);

  const labels = hiring.labels ?? {};
  const contact = shown ? listingContact(shown, hiring) : { name: "", email: "" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl"
      >
        {shown && (
          <>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-popover/95 px-6 py-5 backdrop-blur">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <ModeChip mode={shown.mode} labels={labels} />
                  {shown.type && <span className="text-xs font-medium text-muted-foreground">{shown.type}</span>}
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {shown.title}
                </DialogTitle>
                {shown.summary ? (
                  <DialogDescription className="text-sm text-muted-foreground">{shown.summary}</DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">{shown.title}</DialogDescription>
                )}
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label={labels.close}>
                  <X />
                </Button>
              </DialogClose>
            </div>

            <div className="space-y-6 px-6 py-6">
              <PositionFacts listing={shown} labels={labels} />
              <RichText
                text={shown.description}
                className="text-[15px] leading-relaxed text-foreground/85"
              />
              {contact.email && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-4 text-primary" aria-hidden="true" />
                  {labels.contact && <span>{labels.contact}</span>}
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary"
                  >
                    {contact.name || contact.email}
                  </a>
                </p>
              )}

              <ApplyForm key={shown.id ?? shown.slug} listing={shown} hiring={hiring} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type Status = "idle" | "submitting" | "success" | "error" | "invalid";
type Fields = { name: string; email: string; cvUrl: string; message: string; website: string };
type FieldName = Exclude<keyof Fields, "website">;

function invalidFields(f: Fields): Set<FieldName> {
  const bad = new Set<FieldName>();
  if (!f.name.trim() || f.name.length > APPLICATION_LIMITS.name) bad.add("name");
  if (!EMAIL_PATTERN.test(f.email.trim()) || f.email.length > APPLICATION_LIMITS.email) bad.add("email");
  if (!URL_PATTERN.test(f.cvUrl.trim()) || f.cvUrl.length > APPLICATION_LIMITS.cvUrl) bad.add("cvUrl");
  if (!f.message.trim() || f.message.length > APPLICATION_LIMITS.message) bad.add("message");
  return bad;
}

function ApplyForm({ listing, hiring }: { listing: HiringListing; hiring: HiringContent }) {
  const labels = hiring.labels ?? {};
  const form = labels.form ?? {};
  const [fields, setFields] = React.useState<Fields>({ name: "", email: "", cvUrl: "", message: "", website: "" });
  const [status, setStatus] = React.useState<Status>("idle");
  const [bad, setBad] = React.useState<Set<FieldName>>(new Set());
  // Safe to read the clock while rendering: dialog content only renders on the
  // client, after it is opened, so it is never part of the static HTML.
  if (isPastDeadline(listing.deadline)) {
    return (
      <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
        {labels.closed}
      </p>
    );
  }

  if (status === "success") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-4 text-sm text-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="leading-relaxed">{form.success}</p>
      </div>
    );
  }

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (bad.has(key as FieldName)) {
      setBad((b) => {
        const next = new Set(b);
        next.delete(key as FieldName);
        return next;
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = invalidFields(fields);
    setBad(invalid);
    if (invalid.size > 0) {
      setStatus("invalid");
      return;
    }
    // Honeypot: people never see this field, so anything in it is a bot. Look
    // successful and store nothing.
    if (fields.website) {
      setStatus("success");
      return;
    }
    setStatus("submitting");
    try {
      await addDoc(collection(liteDb, "applications"), {
        listingId: listing.id ?? listing.slug ?? "",
        listingTitle: listing.title ?? "",
        name: fields.name.trim(),
        email: fields.email.trim(),
        cvUrl: fields.cvUrl.trim(),
        message: fields.message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setStatus("success");
    } catch (err) {
      console.error("Application failed", err);
      setStatus("error");
    }
  };

  const busy = status === "submitting";
  const id = (name: string) => `apply-${listing.slug}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-border bg-card/60 p-5">
      <h3 className="text-base font-bold tracking-tight text-foreground">{labels.apply}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("name")}>{form.name}</Label>
          <Input
            id={id("name")}
            autoComplete="name"
            required
            maxLength={APPLICATION_LIMITS.name}
            value={fields.name}
            onChange={set("name")}
            aria-invalid={bad.has("name") || undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("email")}>{form.email}</Label>
          <Input
            id={id("email")}
            type="email"
            autoComplete="email"
            required
            maxLength={APPLICATION_LIMITS.email}
            value={fields.email}
            onChange={set("email")}
            aria-invalid={bad.has("email") || undefined}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("cv")}>{form.cvUrl}</Label>
        <Input
          id={id("cv")}
          type="url"
          inputMode="url"
          required
          placeholder="https://"
          maxLength={APPLICATION_LIMITS.cvUrl}
          value={fields.cvUrl}
          onChange={set("cvUrl")}
          aria-invalid={bad.has("cvUrl") || undefined}
          aria-describedby={form.cvHint ? id("cv-hint") : undefined}
        />
        {form.cvHint && (
          <p id={id("cv-hint")} className="text-xs text-muted-foreground">
            {form.cvHint}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("message")}>{form.message}</Label>
        <Textarea
          id={id("message")}
          required
          rows={5}
          maxLength={APPLICATION_LIMITS.message}
          value={fields.message}
          onChange={set("message")}
          aria-invalid={bad.has("message") || undefined}
          aria-describedby={form.messageHint ? id("message-hint") : undefined}
          className="min-h-28"
        />
        {form.messageHint && (
          <p id={id("message-hint")} className="text-xs text-muted-foreground">
            {form.messageHint}
          </p>
        )}
      </div>

      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} tabIndex={-1} autoComplete="off" value={fields.website} onChange={set("website")} />
      </div>

      {(status === "invalid" || status === "error") && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {status === "invalid" ? form.invalid : form.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {form.privacyNote && <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-sm">{form.privacyNote}</p>}
        <Button type="submit" disabled={busy} className="shrink-0">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? form.submitting : form.submit}
        </Button>
      </div>
    </form>
  );
}
