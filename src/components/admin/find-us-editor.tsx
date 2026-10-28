"use client";

import { useState } from "react";
import { ChevronRight, ImageDown, Plus, Trash2 } from "lucide-react";

import { MediaListEditor } from "@/components/admin/media-list-editor";
import { ShareImageDialog } from "@/components/admin/share-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  formatDateRange,
  isPast,
  todayNumber,
  type Conference,
  type FindUsContent,
  type FindUsLabels,
  type Person,
} from "@/lib/find-us";
import { topicSlug } from "@/lib/research";
import { getImageUrl } from "@/lib/utils";

type Update = (fn: (findUs: FindUsContent) => FindUsContent) => void;

const label = "text-[12px] font-mono uppercase text-muted-foreground";
const textarea =
  "w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-sans leading-relaxed";
const card = "relative bg-card border border-border rounded p-6 shadow-sm space-y-4";

function CardTag({ children }: { children: string }) {
  return (
    <div className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center border-b border-l border-border bg-muted font-mono text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}

const LABEL_FIELDS: [keyof FindUsLabels, string][] = [
  ["upcomingHeading", "Upcoming Heading"],
  ["pastHeading", "Past Heading"],
  ["emptyUpcoming", "No Upcoming Message"],
  ["emptyPast", "No Past Message (optional)"],
  ["allYears", "All Years Chip"],
  ["attendees", "Attendees Label (upcoming)"],
  ["pastAttendees", "Attendees Label (past)"],
  ["bookMeeting", "Book Meeting Button"],
  ["conferenceSite", "Conference Site Button"],
  ["photos", "Photos Button"],
  ["close", "Close (screen readers)"],
  ["previous", "Previous Photo (screen readers)"],
  ["next", "Next Photo (screen readers)"],
  ["goToSlide", "Go To Photo, {n} = number"],
  ["shareEyebrow", "Share Image: Eyebrow"],
  ["shareCta", "Share Image: Call To Action"],
  ["shareScan", "Share Image: Scan Hint"],
];

/** Moves item `index` by `delta`; out-of-range moves are ignored. */
function moved<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function FindUsEditor({
  findUs,
  update,
  people,
  brandLine,
  onDeleteFile,
}: {
  findUs: FindUsContent;
  update: Update;
  /** Everyone pickable as an attendee (PI first, then the People sections). */
  people: Person[];
  /** Footer line on share images, e.g. "ThirdSpace · University of Toronto". */
  brandLine: string;
  onDeleteFile: (path: string) => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const conferences = findUs.conferences ?? [];
  const labels = findUs.labels ?? {};
  const today = todayNumber();

  const setField = <K extends keyof FindUsContent>(field: K, value: FindUsContent[K]) => update((f) => ({ ...f, [field]: value }));
  const setLabel = (field: keyof FindUsLabels, value: string) =>
    update((f) => ({ ...f, labels: { ...(f.labels ?? {}), [field]: value } }));
  const setConferences = (fn: (list: Conference[]) => Conference[]) => update((f) => ({ ...f, conferences: fn(f.conferences ?? []) }));
  const updateConference = (index: number, patch: Partial<Conference>) =>
    setConferences((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const addConference = () => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `conference-${Date.now()}`;
    setConferences((list) => [
      { id, slug: "", name: "", fullName: "", startDate: "", endDate: "", location: "", websiteUrl: "", calendlyUrl: "", note: "", attendees: [], guests: "", photos: [] },
      ...list,
    ]);
    setOpenId(id);
  };

  const sharing = conferences.find((c) => c.id === shareId);

  return (
    <div className="space-y-4">
      {/* F1: section */}
      <div className={card}>
        <CardTag>F1</CardTag>
        <div className="mb-2">
          <span className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground">Draft Sheet</span>
          <h3 className="text-base font-bold text-foreground font-serif">Find Us Section</h3>
          <p className="text-[13px] text-muted-foreground">
            Conferences lab members attend, on /contact after Join us. Upcoming and past are split automatically by date: a conference moves to Past the day after it ends. Past ones can be filtered by year and get a photo gallery.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded border border-border/80 bg-muted/40 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="findus-enabled" className="text-xs font-mono uppercase text-foreground font-semibold cursor-pointer">Show Find Us Section</Label>
            <p className="text-[11px] font-mono text-muted-foreground">Shows the section on /contact.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono uppercase font-semibold text-muted-foreground">{findUs.enabled ? "Enabled" : "Disabled"}</span>
            <Switch id="findus-enabled" checked={findUs.enabled ?? false} onCheckedChange={(checked) => setField("enabled", checked)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={label}>Heading</Label>
            <Input value={findUs.heading ?? ""} onChange={(e) => setField("heading", e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className={label}>Lab Calendly Link</Label>
            <Input value={findUs.calendlyUrl ?? ""} placeholder="https://calendly.com/…" onChange={(e) => setField("calendlyUrl", e.target.value)} className="font-mono text-xs" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className={label}>Intro (blank line = new paragraph, [text](url) = link)</Label>
            <textarea rows={3} value={findUs.intro ?? ""} onChange={(e) => setField("intro", e.target.value)} className={textarea} />
          </div>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          &quot;Book a meeting&quot; buttons and share-image QR codes use a conference&apos;s own Calendly link if it has one, otherwise this lab link. With neither, the button is hidden and the QR code opens /contact#find-us.
        </p>
      </div>

      {/* F2: labels */}
      <div className={card}>
        <CardTag>F2</CardTag>
        <div className="mb-2">
          <h3 className="text-base font-bold text-foreground font-serif">Labels</h3>
          <p className="text-[13px] text-muted-foreground">Text in the section, the photo gallery and the generated share images.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {LABEL_FIELDS.map(([field, name]) => (
            <div key={field} className="space-y-1">
              <Label className={label}>{name}</Label>
              <Input value={labels[field] ?? ""} onChange={(e) => setLabel(field, e.target.value)} className="text-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Conferences */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-mono uppercase text-muted-foreground tracking-wider">
          Conferences ({conferences.length}) — the site sorts them by date
        </span>
        <Button size="xs" variant="outline" onClick={addConference}>
          <Plus className="h-3 w-3" /> Add Conference
        </Button>
      </div>

      {conferences.map((conference, ci) => {
        const key = conference.id ?? `conference-${ci}`;
        const open = openId === key;
        const past = isPast(conference, today);
        const picked = new Set(conference.attendees ?? []);
        const toggle = (personKey: string) =>
          updateConference(ci, {
            attendees: picked.has(personKey)
              ? (conference.attendees ?? []).filter((k) => k !== personKey)
              : [...(conference.attendees ?? []), personKey],
          });
        return (
          <div key={key} className="relative bg-card border border-border rounded shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <button type="button" onClick={() => setOpenId(open ? null : key)} className="flex min-w-0 items-center gap-3 text-left">
                <span className="font-mono text-[13px] text-muted-foreground">C{String(ci + 1).padStart(2, "0")}</span>
                <span className="truncate text-sm font-semibold text-foreground">{conference.name || "Untitled conference"}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{formatDateRange(conference.startDate, conference.endDate) || "no dates"}</span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${past ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  {past ? "Past" : "Upcoming"}
                </span>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
              </button>
              <div className="flex gap-1">
                <Button size="xs" variant="outline" onClick={() => setShareId(conference.id ?? null)} disabled={!conference.id || !conference.name}>
                  <ImageDown className="h-3 w-3" /> Share Image
                </Button>
                <Button size="xs" variant="ghost" disabled={ci === 0} onClick={() => setConferences((l) => moved(l, ci, -1))}>Up</Button>
                <Button size="xs" variant="ghost" disabled={ci === conferences.length - 1} onClick={() => setConferences((l) => moved(l, ci, 1))}>Down</Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Remove "${conference.name || "Untitled conference"}"? Its photos stay in ImageKit.`)) {
                      setConferences((l) => l.filter((_, i) => i !== ci));
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </div>
            </div>

            {open && (
              <div className="space-y-5 border-t border-border p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className={label}>Short Name (e.g. CHI 2027)</Label>
                    <Input
                      value={conference.name ?? ""}
                      onChange={(e) => {
                        const name = e.target.value;
                        const followSlug = !conference.slug || conference.slug === topicSlug(conference.name ?? "");
                        updateConference(ci, followSlug ? { name, slug: topicSlug(name) } : { name });
                      }}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Slug (/contact#conference-…)</Label>
                    <Input value={conference.slug ?? ""} onChange={(e) => updateConference(ci, { slug: topicSlug(e.target.value) })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className={label}>Full Name (optional)</Label>
                    <Input value={conference.fullName ?? ""} placeholder="ACM CHI Conference on Human Factors in Computing Systems" onChange={(e) => updateConference(ci, { fullName: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Start Date</Label>
                    <Input type="date" value={conference.startDate ?? ""} onChange={(e) => updateConference(ci, { startDate: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>End Date (empty = one day)</Label>
                    <Input type="date" value={conference.endDate ?? ""} onChange={(e) => updateConference(ci, { endDate: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Location (City, Country)</Label>
                    <Input value={conference.location ?? ""} onChange={(e) => updateConference(ci, { location: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Conference Website</Label>
                    <Input value={conference.websiteUrl ?? ""} placeholder="https://" onChange={(e) => updateConference(ci, { websiteUrl: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Calendly Link for this Conference (optional)</Label>
                    <Input value={conference.calendlyUrl ?? ""} placeholder={findUs.calendlyUrl || "uses the lab link"} onChange={(e) => updateConference(ci, { calendlyUrl: e.target.value })} className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Note (e.g. Presenting two papers)</Label>
                    <Input value={conference.note ?? ""} onChange={(e) => updateConference(ci, { note: e.target.value })} className="text-xs" />
                  </div>
                </div>

                <div className="space-y-3 rounded border border-border/80 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs font-mono uppercase font-semibold text-foreground">Attendees ({picked.size})</p>
                    <p className="text-[11px] font-mono text-muted-foreground">Picked from People: photos, names and profile links come from there.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {people.map((person) => (
                      <label key={person.key} className={`flex cursor-pointer items-center gap-2.5 rounded border px-2.5 py-1.5 text-xs transition-colors ${picked.has(person.key) ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:bg-muted/50"}`}>
                        <input type="checkbox" checked={picked.has(person.key)} onChange={() => toggle(person.key)} className="accent-[var(--primary)]" />
                        <span className="relative inline-flex size-7 shrink-0 overflow-hidden rounded-full bg-muted">
                          {person.imagePath && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${getImageUrl(person.imagePath)}?tr=w-64,h-64,fo-face`} alt="" className="size-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground">{person.name}</span>
                          <span className="block truncate font-mono text-[10px] text-muted-foreground">{person.role}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className={label}>Guests (comma-separated, e.g. alumni or collaborators)</Label>
                    <Input value={conference.guests ?? ""} onChange={(e) => updateConference(ci, { guests: e.target.value })} className="text-xs" />
                  </div>
                </div>

                <div className="space-y-2 rounded border border-border/80 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs font-mono uppercase font-semibold text-foreground">Photos ({(conference.photos ?? []).length})</p>
                    <p className="text-[11px] font-mono text-muted-foreground">Shown as a gallery once the conference is past. Uploaded to ImageKit /find-us/{conference.slug || "…"}.</p>
                  </div>
                  <MediaListEditor
                    media={conference.photos ?? []}
                    onChange={(photos) => updateConference(ci, { photos })}
                    folder={`/find-us/${conference.slug || "conference"}`}
                    onDeleteFile={onDeleteFile}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sharing && (
        <ShareImageDialog
          conference={sharing}
          findUs={findUs}
          people={people}
          brandLine={brandLine}
          open={!!sharing}
          onOpenChange={(open) => !open && setShareId(null)}
        />
      )}
    </div>
  );
}
