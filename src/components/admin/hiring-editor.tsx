"use client";

import { useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";

import { ApplicationsPanel } from "@/components/admin/applications-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  HIRING_MODES,
  type HiringContent,
  type HiringEmailLabels,
  type HiringFormLabels,
  type HiringLabels,
  type HiringListing,
  type HiringMode,
  type HiringStep,
} from "@/lib/hiring";
import { topicSlug } from "@/lib/research";

type Update = (fn: (hiring: HiringContent) => HiringContent) => void;

const label = "text-[12px] font-mono uppercase text-muted-foreground";
const textarea =
  "w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed";
const select =
  "h-8 w-full rounded border border-input bg-background px-2 font-mono text-xs text-foreground focus:outline-none focus:border-ring";
const card = "relative bg-card border border-border rounded p-6 shadow-sm space-y-4";

function CardTag({ children }: { children: string }) {
  return (
    <div className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center border-b border-l border-border bg-muted font-mono text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}

/** Moves item `index` by `delta`; out-of-range moves are ignored. */
function moved<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const LABEL_FIELDS: [Exclude<keyof HiringLabels, "modes" | "form">, string][] = [
  ["positionsHeading", "Positions Heading"],
  ["processHeading", "How We Hire Heading"],
  ["viewDetails", "Row Link"],
  ["apply", "Form Heading"],
  ["mentor", "Mentor"],
  ["commitment", "Commitment"],
  ["deadline", "Deadline"],
  ["contact", "Contact Line"],
  ["closed", "Closed Message"],
  ["close", "Close Button (screen readers)"],
];

const FORM_FIELDS: [keyof HiringFormLabels, string][] = [
  ["name", "Name Field"],
  ["email", "Email Field"],
  ["cvUrl", "CV Link Field"],
  ["cvHint", "CV Link Hint"],
  ["message", "Message Field"],
  ["messageHint", "Message Hint"],
  ["submit", "Submit Button"],
  ["submitting", "Submitting"],
  ["invalid", "Invalid Fields Message"],
  ["error", "Error Message"],
  ["success", "Success Message"],
  ["privacyNote", "Privacy Note"],
];

const MODE_FALLBACK: Record<HiringMode, string> = { online: "Online", offline: "In person", hybrid: "Hybrid" };

export function HiringEditor({ hiring, update }: { hiring: HiringContent; update: Update }) {
  const [openListing, setOpenListing] = useState<string | null>(null);
  const listings = hiring.listings ?? [];
  const steps = hiring.process ?? [];
  const labels = hiring.labels ?? {};

  const setField = <K extends keyof HiringContent>(field: K, value: HiringContent[K]) =>
    update((h) => ({ ...h, [field]: value }));
  const setLabel = (field: keyof HiringLabels, value: string) =>
    update((h) => ({ ...h, labels: { ...(h.labels ?? {}), [field]: value } }));
  const setModeLabel = (mode: HiringMode, value: string) =>
    update((h) => ({ ...h, labels: { ...(h.labels ?? {}), modes: { ...(h.labels?.modes ?? {}), [mode]: value } } }));
  const setFormLabel = (field: keyof HiringFormLabels, value: string) =>
    update((h) => ({ ...h, labels: { ...(h.labels ?? {}), form: { ...(h.labels?.form ?? {}), [field]: value } } }));
  const setEmailLabel = (field: keyof HiringEmailLabels, value: string) =>
    update((h) => ({ ...h, labels: { ...(h.labels ?? {}), email: { ...(h.labels?.email ?? {}), [field]: value } } }));

  const setSteps = (fn: (steps: HiringStep[]) => HiringStep[]) => update((h) => ({ ...h, process: fn(h.process ?? []) }));
  const setListings = (fn: (listings: HiringListing[]) => HiringListing[]) =>
    update((h) => ({ ...h, listings: fn(h.listings ?? []) }));
  const updateListing = (index: number, patch: Partial<HiringListing>) =>
    setListings((list) => list.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const addListing = () => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `listing-${Date.now()}`;
    // New listings start closed so a half-written one never goes live by accident.
    setListings((list) => [
      { id, slug: "", title: "", type: "", summary: "", description: "", mode: "hybrid", mentor: "", commitment: "", deadline: "", open: false, contactName: "", contactEmail: "", assignment: { autoSend: false, subject: "", body: "", url: "" } },
      ...list,
    ]);
    setOpenListing(id);
  };

  return (
    <div className="space-y-4">
      {/* H1 — section */}
      <div className={card}>
        <CardTag>H1</CardTag>
        <div className="mb-2">
          <span className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
          <h3 className="text-base font-bold text-foreground font-serif">Hiring Section</h3>
          <p className="text-[13px] text-muted-foreground">
            Open positions at the bottom of /contact. Applications go to Firestore and are emailed to each position&apos;s contact person by the mailer (GitHub Actions, every ~5 min). A position can be linked directly as /contact#position-&lt;slug&gt;.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded border border-border/80 bg-muted/40 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="hiring-enabled" className="text-xs font-mono uppercase text-foreground font-semibold cursor-pointer">Show Hiring Section</Label>
            <p className="text-[11px] font-mono text-muted-foreground">Shows the section on /contact (with the empty message when no position is open).</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono uppercase font-semibold text-muted-foreground">{hiring.enabled ? "Enabled" : "Disabled"}</span>
            <Switch id="hiring-enabled" checked={hiring.enabled ?? false} onCheckedChange={(checked) => setField("enabled", checked)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={label}>Heading</Label>
            <Input value={hiring.heading ?? ""} onChange={(e) => setField("heading", e.target.value)} className="font-mono text-xs" />
          </div>
          <div />
          <div className="space-y-1 col-span-2">
            <Label className={label}>Intro (blank line = new paragraph, [text](url) = link)</Label>
            <textarea rows={3} value={hiring.intro ?? ""} onChange={(e) => setField("intro", e.target.value)} className={textarea} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className={label}>No Open Positions Message</Label>
            <textarea rows={2} value={hiring.emptyLabel ?? ""} onChange={(e) => setField("emptyLabel", e.target.value)} className={textarea} />
          </div>
        </div>
        <div className="space-y-3 rounded border border-border/80 bg-muted/30 p-4">
          <div>
            <p className="text-xs font-mono uppercase font-semibold text-foreground">Default Contact Person</p>
            <p className="text-[11px] font-mono text-muted-foreground">Receives applications for every position that has no contact of its own, and signs the emails.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={label}>Name</Label>
              <Input value={hiring.defaultContactName ?? ""} onChange={(e) => setField("defaultContactName", e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className={label}>Email</Label>
              <Input type="email" value={hiring.defaultContactEmail ?? ""} onChange={(e) => setField("defaultContactEmail", e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* H2 — labels */}
      <div className={card}>
        <CardTag>H2</CardTag>
        <div className="mb-2">
          <h3 className="text-base font-bold text-foreground font-serif">Labels</h3>
          <p className="text-[13px] text-muted-foreground">Text on the position rows, the detail window and the apply form.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {HIRING_MODES.map((mode) => (
            <div key={mode} className="space-y-1">
              <Label className={label}>Mode: {MODE_FALLBACK[mode]}</Label>
              <Input value={labels.modes?.[mode] ?? ""} onChange={(e) => setModeLabel(mode, e.target.value)} className="font-mono text-xs" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {LABEL_FIELDS.map(([field, name]) => (
            <div key={field} className="space-y-1">
              <Label className={label}>{name}</Label>
              <Input value={(labels[field] as string | undefined) ?? ""} onChange={(e) => setLabel(field, e.target.value)} className="font-mono text-xs" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          {FORM_FIELDS.map(([field, name]) => (
            <div key={field} className={`space-y-1 ${field === "success" || field === "error" ? "col-span-2" : ""}`}>
              <Label className={label}>{name}</Label>
              <Input value={labels.form?.[field] ?? ""} onChange={(e) => setFormLabel(field, e.target.value)} className="text-xs" />
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-[11px] font-mono text-muted-foreground">Assignment email (sent to applicants). Empty fields use the built-in wording.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={label}>Assignment Button</Label>
              <Input value={labels.email?.assignmentLink ?? ""} placeholder="Open the assignment" onChange={(e) => setEmailLabel("assignmentLink", e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className={label}>Closing Note ({"{contact}"} = contact name)</Label>
              <Input value={labels.email?.replyNote ?? ""} placeholder="Questions? Reply to this email and it goes straight to {contact}." onChange={(e) => setEmailLabel("replyNote", e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* H3 — how we hire */}
      <div className={card}>
        <CardTag>H3</CardTag>
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground font-serif">How We Hire</h3>
            <p className="text-[13px] text-muted-foreground">Numbered steps under the positions. Leave empty to hide.</p>
          </div>
          <Button size="xs" variant="outline" onClick={() => setSteps((s) => [...s, { title: "", body: "" }])}>
            <Plus className="h-3 w-3" /> Add Step
          </Button>
        </div>
        {steps.map((step, si) => (
          <div key={si} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded border border-border/80 bg-muted/30 p-3">
            <span className="pt-1.5 font-mono text-[13px] text-muted-foreground">{String(si + 1).padStart(2, "0")}</span>
            <div className="space-y-2">
              <Input value={step.title ?? ""} placeholder="Step title" onChange={(e) => setSteps((s) => s.map((x, i) => (i === si ? { ...x, title: e.target.value } : x)))} className="font-mono text-xs" />
              <textarea rows={2} value={step.body ?? ""} placeholder="One or two sentences" onChange={(e) => setSteps((s) => s.map((x, i) => (i === si ? { ...x, body: e.target.value } : x)))} className={textarea} />
            </div>
            <div className="flex flex-col gap-1">
              <Button size="xs" variant="ghost" disabled={si === 0} onClick={() => setSteps((s) => moved(s, si, -1))}>Up</Button>
              <Button size="xs" variant="ghost" disabled={si === steps.length - 1} onClick={() => setSteps((s) => moved(s, si, 1))}>Down</Button>
              <Button size="xs" variant="ghost" onClick={() => setSteps((s) => s.filter((_, i) => i !== si))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Listings */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono uppercase text-muted-foreground tracking-wider">
          Positions ({listings.length}, {listings.filter((l) => l.open !== false).length} open) — shown in this order
        </span>
        <Button size="xs" variant="outline" onClick={addListing}>
          <Plus className="h-3 w-3" /> Add Position
        </Button>
      </div>

      {listings.map((listing, li) => {
        const key = listing.id ?? `listing-${li}`;
        const open = openListing === key;
        const assignment = listing.assignment ?? {};
        const setAssignment = (patch: Partial<NonNullable<HiringListing["assignment"]>>) =>
          updateListing(li, { assignment: { ...assignment, ...patch } });
        return (
          <div key={key} className="relative bg-card border border-border rounded shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <button type="button" onClick={() => setOpenListing(open ? null : key)} className="flex min-w-0 items-center gap-3 text-left">
                <span className="font-mono text-[13px] text-muted-foreground">J{String(li + 1).padStart(2, "0")}</span>
                <span className="truncate text-sm font-semibold text-foreground">{listing.title || "Untitled position"}</span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${listing.open === false ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  {listing.open === false ? "Hidden" : "Open"}
                </span>
                {assignment.autoSend && <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent-foreground">Auto-assignment</span>}
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
              </button>
              <div className="flex gap-1">
                <Button size="xs" variant="ghost" disabled={li === 0} onClick={() => setListings((l) => moved(l, li, -1))}>Up</Button>
                <Button size="xs" variant="ghost" disabled={li === listings.length - 1} onClick={() => setListings((l) => moved(l, li, 1))}>Down</Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Remove "${listing.title || "Untitled position"}"? Its applications stay in Firestore.`)) {
                      setListings((l) => l.filter((_, i) => i !== li));
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </div>
            </div>

            {open && (
              <div className="space-y-5 border-t border-border p-5">
                <div className="flex items-center justify-between gap-3 rounded border border-border/80 bg-muted/40 p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor={`listing-open-${key}`} className="text-xs font-mono uppercase text-foreground font-semibold cursor-pointer">Open (shown on the site)</Label>
                    <p className="text-[11px] font-mono text-muted-foreground">Off hides it and the mailer skips new applications for it.</p>
                  </div>
                  <Switch id={`listing-open-${key}`} checked={listing.open !== false} onCheckedChange={(checked) => updateListing(li, { open: checked })} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className={label}>Title</Label>
                    <Input
                      value={listing.title ?? ""}
                      onChange={(e) => {
                        const title = e.target.value;
                        // Keep the slug following the title until it is edited by hand.
                        const followSlug = !listing.slug || listing.slug === topicSlug(listing.title ?? "");
                        updateListing(li, followSlug ? { title, slug: topicSlug(title) } : { title });
                      }}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Slug (/contact#position-…)</Label>
                    <Input value={listing.slug ?? ""} onChange={(e) => updateListing(li, { slug: topicSlug(e.target.value) })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Type (e.g. Research Assistant · Undergraduate)</Label>
                    <Input value={listing.type ?? ""} onChange={(e) => updateListing(li, { type: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Mode</Label>
                    <select value={listing.mode ?? "hybrid"} onChange={(e) => updateListing(li, { mode: e.target.value as HiringMode })} className={select}>
                      {HIRING_MODES.map((mode) => (
                        <option key={mode} value={mode}>{labels.modes?.[mode] || MODE_FALLBACK[mode]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Mentor</Label>
                    <Input value={listing.mentor ?? ""} onChange={(e) => updateListing(li, { mentor: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Commitment (e.g. 8–10 h / week · Winter 2027)</Label>
                    <Input value={listing.commitment ?? ""} onChange={(e) => updateListing(li, { commitment: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Deadline (optional; closes after this day)</Label>
                    <Input type="date" value={listing.deadline ?? ""} onChange={(e) => updateListing(li, { deadline: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Summary (one line on the row)</Label>
                    <Input value={listing.summary ?? ""} onChange={(e) => updateListing(li, { summary: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className={label}>Description (blank line = new paragraph, [text](url) = link)</Label>
                    <textarea rows={8} value={listing.description ?? ""} onChange={(e) => updateListing(li, { description: e.target.value })} className={textarea} />
                  </div>
                </div>

                <div className="space-y-3 rounded border border-border/80 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs font-mono uppercase font-semibold text-foreground">Contact Person</p>
                    <p className="text-[11px] font-mono text-muted-foreground">Applications for this position are emailed here. Empty = the default contact ({hiring.defaultContactEmail || "not set"}).</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className={label}>Name</Label>
                      <Input value={listing.contactName ?? ""} placeholder={hiring.defaultContactName} onChange={(e) => updateListing(li, { contactName: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className={label}>Email</Label>
                      <Input type="email" value={listing.contactEmail ?? ""} placeholder={hiring.defaultContactEmail} onChange={(e) => updateListing(li, { contactEmail: e.target.value })} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded border border-border/80 bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label htmlFor={`listing-assign-${key}`} className="text-xs font-mono uppercase text-foreground font-semibold cursor-pointer">Auto-send Assignment</Label>
                      <p className="text-[11px] font-mono text-muted-foreground">Emails this to every applicant right after they apply (reply-to = the contact person). {"{name}"} and {"{position}"} are filled in.</p>
                    </div>
                    <Switch id={`listing-assign-${key}`} checked={assignment.autoSend ?? false} onCheckedChange={(checked) => setAssignment({ autoSend: checked })} />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Email Subject</Label>
                    <Input value={assignment.subject ?? ""} placeholder="Your assignment for {position}" onChange={(e) => setAssignment({ subject: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Email Body (plain text)</Label>
                    <textarea rows={6} value={assignment.body ?? ""} placeholder={"Hi {name},\n\nThanks for applying for {position}. …"} onChange={(e) => setAssignment({ body: e.target.value })} className={textarea} />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Assignment Link (optional, e.g. a Google Doc)</Label>
                    <Input value={assignment.url ?? ""} placeholder="https://" onChange={(e) => setAssignment({ url: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* H4 — applications */}
      <ApplicationsPanel listings={listings} />
    </div>
  );
}
