"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Loader2, Plus, Star, Trash2 } from "lucide-react";

import { ImageUploader } from "@/components/image-uploader";
import { KIND_META, KIND_ORDER } from "@/components/blog/resource-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostResource, ResourceKind } from "@/lib/blog";
import { arxivIdFrom, detectKind, doiFrom, vimeoId, youtubeId } from "@/lib/blog-resources";

export type PaperOption = {
  title: string;
  authors?: string;
  venue?: string;
  year?: string;
  doi?: string;
  url?: string;
};

const field = "space-y-1";
const label = "text-[12px] font-mono uppercase text-muted-foreground";
const textarea =
  "w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring font-mono leading-relaxed";

function newId(kind: ResourceKind): string {
  return `${kind}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Best-effort details fetched in the browser when a link is added, so the
 * editor sees a title straight away. The build fetches the same things again
 * (scripts/lib/resources-enrich.mjs), so a blocked request here costs nothing.
 */
async function prefill(r: PostResource): Promise<Partial<PostResource>> {
  try {
    if (youtubeId(r.url)) {
      const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(r.url)}`);
      if (res.ok) {
        const d = await res.json();
        return { title: d.title, provider: "youtube", thumbnail: `https://i.ytimg.com/vi/${youtubeId(r.url)}/hqdefault.jpg` };
      }
      return { provider: "youtube" };
    }
    if (vimeoId(r.url)) {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(r.url)}`);
      if (res.ok) {
        const d = await res.json();
        return { title: d.title, provider: "vimeo", thumbnail: d.thumbnail_url, durationSeconds: d.duration };
      }
      return { provider: "vimeo" };
    }
    if (r.kind === "paper") {
      const doi = doiFrom(r.url);
      if (doi) {
        const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (!res.ok) return { doi };
        const w = (await res.json()).message;
        return {
          doi,
          title: w.title?.[0],
          authors: (w.author ?? []).map((a: { given?: string; family?: string }) => [a.given, a.family].filter(Boolean).join(" ")).join(", "),
          venue: w["container-title"]?.[0],
          year: String(w.issued?.["date-parts"]?.[0]?.[0] ?? ""),
        };
      }
      const arxivId = arxivIdFrom(r.url);
      if (arxivId) return { arxivId, venue: "arXiv", pdfUrl: `https://arxiv.org/pdf/${arxivId}` };
    }
  } catch {
    // Blocked by CORS or offline: the build fills these in.
  }
  return {};
}

function TextField({ name, value, onChange, placeholder, wide = false }: { name: string; value?: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean }) {
  return (
    <div className={`${field} ${wide ? "col-span-2" : ""}`}>
      <Label className={label}>{name}</Label>
      <Input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
    </div>
  );
}

/** Comma-separated names with suggestions from the People page; guests are typed freely. */
function NamesField({ name, value, onChange, people }: { name: string; value?: string[]; onChange: (v: string[]) => void; people: string[] }) {
  const [text, setText] = useState((value ?? []).join(", "));
  return (
    <div className={`${field} col-span-2`}>
      <Label className={label}>{name}</Label>
      <Input
        value={text}
        list="blog-people"
        placeholder="Names, comma-separated. People-page names link to their profile."
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        className="font-mono text-xs"
      />
      <datalist id="blog-people">
        {people.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </div>
  );
}

function KindFields({ r, set, people, folder }: { r: PostResource; set: (patch: Partial<PostResource>) => void; people: string[]; folder: string }) {
  const isVideo = r.kind === "video" || (r.kind === "demo" && detectKind(r.url) === "video");
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField name="Title" value={r.title} onChange={(v) => set({ title: v })} wide placeholder={r.kind === "code" ? "Filled from GitHub if empty" : "Filled automatically for papers and videos if empty"} />
      <TextField name="URL" value={r.url} onChange={(v) => set({ url: v })} wide />
      <TextField name="One-line description" value={r.description} onChange={(v) => set({ description: v || undefined })} wide />

      {r.kind === "paper" && (
        <>
          <TextField name="Authors (comma-separated)" value={r.authors} onChange={(v) => set({ authors: v || undefined })} wide />
          <TextField name="Venue" value={r.venue} onChange={(v) => set({ venue: v || undefined })} placeholder="ACL 2026" />
          <TextField name="Year" value={r.year} onChange={(v) => set({ year: v || undefined })} />
          <TextField name="DOI" value={r.doi} onChange={(v) => set({ doi: doiFrom(v) ?? (v || undefined) })} placeholder="10.1145/…" />
          <TextField name="arXiv ID" value={r.arxivId} onChange={(v) => set({ arxivId: v || undefined })} placeholder="2608.30084" />
          <TextField name="PDF URL" value={r.pdfUrl} onChange={(v) => set({ pdfUrl: v || undefined })} wide />
          <div className={`${field} col-span-2`}>
            <Label className={label}>BibTeX (generated at build if empty)</Label>
            <textarea rows={4} value={r.bibtex ?? ""} onChange={(e) => set({ bibtex: e.target.value || undefined })} className={textarea} />
          </div>
        </>
      )}

      {isVideo && (
        <>
          <div className={field}>
            <Label className={label}>Video type</Label>
            <select value={r.videoType ?? ""} onChange={(e) => set({ videoType: (e.target.value || undefined) as PostResource["videoType"] })} className="h-8 w-full rounded border border-input bg-background px-2 font-mono text-xs">
              <option value="">—</option>
              {["demo", "talk", "discussion", "interview", "explainer"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <TextField name="Duration (seconds)" value={r.durationSeconds ? String(r.durationSeconds) : ""} onChange={(v) => set({ durationSeconds: Number(v) || undefined })} />
          <TextField name="Event" value={r.event} onChange={(v) => set({ event: v || undefined })} placeholder="CHI 2026" />
          <div className={field}>
            <Label className={label}>Recorded on</Label>
            <Input type="date" value={r.recordedAt?.slice(0, 10) ?? ""} onChange={(e) => set({ recordedAt: e.target.value || undefined })} className="font-mono text-xs" />
          </div>
          <NamesField name="Speakers" value={r.speakers} onChange={(v) => set({ speakers: v.length ? v : undefined })} people={people} />
          <TextField name="Transcript URL" value={r.transcriptUrl} onChange={(v) => set({ transcriptUrl: v || undefined })} wide />
        </>
      )}

      {(isVideo || r.kind === "project" || r.kind === "demo" || r.kind === "slides" || r.kind === "poster") && (
        <div className={`${field} col-span-2`}>
          <Label className={label}>Thumbnail (optional; videos use the provider&apos;s)</Label>
          <ImageUploader currentPath={r.thumbnail ?? ""} folder={folder} onUpload={(path) => set({ thumbnail: path })} />
        </div>
      )}

      {r.kind === "dataset" && (
        <>
          <TextField name="Size" value={r.size} onChange={(v) => set({ size: v || undefined })} placeholder="12k annotated posts" />
          <TextField name="License" value={r.license} onChange={(v) => set({ license: v || undefined })} placeholder="CC BY 4.0" />
        </>
      )}

      {r.kind === "press" && (
        <>
          <TextField name="Outlet" value={r.description} onChange={(v) => set({ description: v || undefined })} />
          <div className={field}>
            <Label className={label}>Date</Label>
            <Input type="date" value={r.recordedAt?.slice(0, 10) ?? ""} onChange={(e) => set({ recordedAt: e.target.value || undefined })} className="font-mono text-xs" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A post's papers, code, videos and other links. Add one by pasting its URL;
 * the kind is guessed from the address and can be changed.
 */
export function ResourcesEditor({
  resources,
  onChange,
  people,
  publications,
  folder,
}: {
  resources: PostResource[];
  onChange: (next: PostResource[]) => void;
  people: string[];
  publications: PaperOption[];
  folder: string;
}) {
  const [url, setUrl] = useState("");
  const [pdfKind, setPdfKind] = useState<"paper" | "slides" | null>(null);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pubQuery, setPubQuery] = useState("");

  const update = (id: string, patch: Partial<PostResource>) =>
    onChange(resources.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= resources.length) return;
    const next = [...resources];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  /** Only one primary per kind: marking one unmarks the others. */
  const togglePrimary = (r: PostResource) =>
    onChange(resources.map((x) => (x.kind !== r.kind ? x : { ...x, primary: x.id === r.id ? !r.primary : false })));

  async function add(kind?: ResourceKind) {
    const trimmed = url.trim();
    if (!trimmed) return;
    const isPdf = /\.pdf(\?|$)/i.test(trimmed);
    // A PDF could be the paper or the slides; ask before guessing.
    if (!kind && isPdf && !/arxiv\.org/i.test(trimmed)) {
      setPdfKind("paper");
      return;
    }
    const detected = kind ?? detectKind(trimmed);
    const base: PostResource = {
      id: newId(detected),
      kind: detected,
      title: "",
      url: trimmed,
      // The first of each kind is primary until the editor says otherwise.
      primary: !resources.some((r) => r.kind === detected) || undefined,
      ...(detected === "paper" && isPdf ? { pdfUrl: trimmed } : {}),
    };
    setAdding(true);
    const extra = await prefill(base);
    setAdding(false);
    onChange([...resources, { ...base, ...extra }]);
    setOpen(base.id);
    setUrl("");
    setPdfKind(null);
  }

  function addPublication(p: PaperOption) {
    const r: PostResource = {
      id: newId("paper"),
      kind: "paper",
      title: p.title,
      url: p.url || (p.doi ? `https://doi.org/${p.doi}` : ""),
      authors: p.authors,
      venue: p.venue,
      year: p.year,
      doi: p.doi,
      primary: !resources.some((x) => x.kind === "paper") || undefined,
    };
    onChange([...resources, r]);
    setPubQuery("");
  }

  const matches = pubQuery.trim().length >= 3
    ? publications.filter((p) => p.title.toLowerCase().includes(pubQuery.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded border border-border/80 bg-muted/40 p-3">
        <Label className={label}>Add a resource by URL</Label>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="https://github.com/…, https://doi.org/…, https://youtu.be/…"
            className="font-mono text-xs"
          />
          <Button size="sm" variant="outline" onClick={() => add()} disabled={adding || !url.trim()}>
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
          </Button>
        </div>
        {pdfKind && (
          <div className="flex items-center gap-2 text-xs">
            <span>This is a PDF. Is it</span>
            <Button size="xs" variant="outline" onClick={() => add("paper")}>the paper</Button>
            <Button size="xs" variant="outline" onClick={() => add("slides")}>slides</Button>
            <Button size="xs" variant="outline" onClick={() => add("poster")}>a poster</Button>
          </div>
        )}
        <div className="relative">
          <Input value={pubQuery} onChange={(e) => setPubQuery(e.target.value)} placeholder="…or pick from Publications (type 3+ letters of the title)" className="text-xs" />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded border border-border bg-popover text-xs shadow-md">
              {matches.map((p, i) => (
                <li key={`${p.title}-${i}`}>
                  <button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => addPublication(p)}>
                    <span className="font-medium">{p.title}</span>
                    <span className="text-muted-foreground"> · {p.venue}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {resources.length === 0 && <p className="text-xs text-muted-foreground">No resources yet.</p>}

      <ul className="space-y-2">
        {resources.map((r, i) => {
          const Icon = KIND_META[r.kind].icon;
          const shortcode = `::resource{id="${r.id}"}`;
          return (
            <li key={r.id} className="rounded border border-border bg-card">
              <div className="flex items-center gap-2 p-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <button type="button" className="min-w-0 flex-1 truncate text-left text-xs font-medium" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  {r.title || r.url}
                </button>
                <select
                  value={r.kind}
                  onChange={(e) => update(r.id, { kind: e.target.value as ResourceKind })}
                  aria-label="Kind"
                  className="h-7 rounded border border-input bg-background px-1 font-mono text-[11px]"
                >
                  {KIND_ORDER.map((k) => (
                    <option key={k} value={k}>{KIND_META[k].label}</option>
                  ))}
                </select>
                <Button size="icon-xs" variant={r.primary ? "default" : "ghost"} title="Primary (shown first, used for citation tags)" onClick={() => togglePrimary(r)}>
                  <Star className="h-3 w-3" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  title={`Copy ${shortcode} to place it in the body`}
                  onClick={async () => {
                    await navigator.clipboard.writeText(shortcode).catch(() => {});
                    setCopied(r.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                >
                  {copied === r.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button size="icon-xs" variant="ghost" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" title="Move down" onClick={() => move(i, 1)} disabled={i === resources.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" title="Remove" onClick={() => onChange(resources.filter((x) => x.id !== r.id))}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              {open === r.id && (
                <div className="border-t border-border p-3">
                  <p className="mb-3 font-mono text-[11px] text-muted-foreground">Shortcode: {shortcode}</p>
                  <KindFields r={r} set={(patch) => update(r.id, patch)} people={people} folder={folder} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
