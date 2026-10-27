"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  type FieldValue,
} from "firebase/firestore";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Plus, Save, Search, Send, Trash2, X as XIcon } from "lucide-react";
import "katex/dist/katex.min.css";

import { postState, postWarnings, fromLocalInput, toLocalInput, type PostState } from "@/components/admin/post-checks";
import { ResourcesEditor, type PaperOption } from "@/components/admin/resources-editor";
import { Markdown } from "@/components/blog/markdown";
import { ImageUploader } from "@/components/image-uploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { postSlug, type Post, type PostAuthor, type ShareState } from "@/lib/blog";
import { db } from "@/lib/firebase";
import { absoluteUrl, shareImageUrl } from "@/lib/site";
import { getImageUrl } from "@/lib/utils";
import {
  buildLinkedinText,
  defaultLinkedinText,
  defaultXText,
  X_BUDGET,
  xLength,
} from "../../../scripts/lib/share-text.mjs";

// ── Site data the editor offers as choices ──────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- config/site is untyped JSON in admin */
function peopleNames(content: any): string[] {
  const names = [
    content?.professor?.name,
    ...(content?.team?.sections ?? []).flatMap((s: any) => (s.members ?? []).map((m: any) => m.name)),
    ...(content?.team?.alumni?.members ?? []).map((m: any) => m.name),
  ];
  return [...new Set(names.filter(Boolean) as string[])];
}

function publicationOptions(content: any): PaperOption[] {
  const years = content?.publications?.years ?? {};
  return Object.values(years).flatMap((y: any) =>
    ["journalArticles", "conferenceProceedings", "extendedAbstracts", "researchArtifacts"].flatMap((k) =>
      (y[k] ?? []).map((p: any) => ({
        title: p.title,
        authors: p.authors,
        venue: p.venue,
        year: (p.venue?.match(/\b(19|20)\d{2}\b/) ?? [])[0] ?? y.label,
        doi: p.doi,
        url: p.url,
      })),
    ),
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Firestore ───────────────────────────────────────────────────────────────

/** Keys the editor owns. `shared` belongs to the share workflow and is never written here. */
const EDITABLE: (keyof Post)[] = [
  "slug", "previousSlugs", "status", "publishedAt", "firstPublishedAt", "updatedAt", "title", "summary",
  "keyFindings", "body", "authors", "tags", "cover", "ogImage", "resources", "researchTopicSlug", "social",
];

/** Firestore rejects `undefined` anywhere in a document, so drop it at every depth. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, stripUndefined(v)]),
    ) as T;
  }
  return value;
}

/**
 * New posts are created whole. Existing ones are updated key by key: each
 * top-level field is replaced outright (a cleared cover really disappears,
 * which a merge would not do), and `shared` is left alone so a save never
 * overwrites what the share workflow recorded.
 */
async function savePost(post: Post, isNew: boolean) {
  const ref = doc(db, "posts", post.id);
  if (isNew) {
    const { id: _id, shared: _shared, ...data } = post;
    void _id;
    void _shared;
    await setDoc(ref, stripUndefined(data));
    return;
  }
  const update: Record<string, unknown | FieldValue> = {};
  for (const key of EDITABLE) {
    const value = post[key];
    const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    update[key] = empty ? deleteField() : stripUndefined(value);
  }
  await updateDoc(ref, update);
}

// ── Small UI pieces ─────────────────────────────────────────────────────────

const label = "text-[12px] font-mono uppercase text-muted-foreground";
const help = "text-[11px] text-muted-foreground";
const textarea =
  "w-full text-xs p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring leading-relaxed";
const panel = "relative bg-card border border-border rounded p-5 shadow-sm space-y-4";

function Counter({ n, min, max }: { n: number; min?: number; max: number }) {
  const bad = n > max || (min !== undefined && n < min);
  return <span className={`font-mono text-[11px] ${bad ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{n}{min !== undefined ? ` (aim ${min}–${max})` : ` / ${max}`}</span>;
}

const STATE_STYLE: Record<PostState, string> = {
  Draft: "bg-muted text-muted-foreground",
  Scheduled: "bg-amber-100 text-amber-900",
  Published: "bg-emerald-100 text-emerald-900",
};

function StateBadge({ state }: { state: PostState }) {
  return <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${STATE_STYLE[state]}`}>{state}</span>;
}

function ShareIcon({ name, share, href }: { name: string; share?: ShareState; href?: string }) {
  if (!share) return <span title={`${name}: not shared`} className="font-mono text-[10px] text-muted-foreground/60">{name}</span>;
  const color = share.status === "done" ? "text-emerald-700" : share.status === "failed" ? "text-destructive" : "text-amber-700";
  const title = `${name}: ${share.status}${share.error ? ` — ${share.error}` : ""}`;
  return href && share.status === "done" ? (
    <a href={href} target="_blank" rel="noreferrer" title={title} className={`font-mono text-[10px] font-semibold underline ${color}`}>{name}</a>
  ) : (
    <span title={title} className={`font-mono text-[10px] font-semibold ${color}`}>{name}</span>
  );
}

const xPostUrl = (id?: string) => (id ? `https://x.com/i/web/status/${id}` : undefined);
const linkedinPostUrl = (id?: string) => (id ? `https://www.linkedin.com/feed/update/${id}` : undefined);

function emptyPost(id: string): Post {
  return {
    id,
    slug: "",
    status: "draft",
    updatedAt: new Date().toISOString(),
    title: "",
    summary: "",
    body: "",
    authors: [],
    tags: [],
    resources: [],
    social: { autoShare: true },
  };
}

// ── Editor ──────────────────────────────────────────────────────────────────

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- config/site is untyped JSON in admin */
export function BlogEditor({ content }: { content: any }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ post: Post; isNew: boolean; saved: Post | null } | null>(null);

  async function load() {
    try {
      const snap = await getDocs(collection(db, "posts"));
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<Post, "id">), id: d.id }));
      list.sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
      setPosts(list);
      setLoadError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(
        /permission/i.test(msg)
          ? "Firestore refused to read posts. Deploy firestore.rules with your email in the admin list (see README → Firestore rules)."
          : msg,
      );
    }
  }

  useEffect(() => {
    // Loading the list from Firestore is the external system this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const people = useMemo(() => peopleNames(content), [content]);
  const publications = useMemo(() => publicationOptions(content), [content]);
  const topics: { slug: string; title: string }[] = (content?.research?.topics ?? []).filter((t: { slug?: string }) => t.slug);
  const allTags = useMemo(() => [...new Set((posts ?? []).flatMap((p) => p.tags ?? []))].sort(), [posts]);
  const socialStatus: { linkedin?: { ok?: boolean; message?: string } } | undefined = content?.socialStatus;

  if (editing) {
    return (
      <PostForm
        key={editing.post.id}
        initial={editing.post}
        saved={editing.saved}
        isNew={editing.isNew}
        others={(posts ?? []).filter((p) => p.id !== editing.post.id)}
        people={people}
        publications={publications}
        topics={topics}
        allTags={allTags}
        xHandle={content?.socials?.xHandle}
        onClose={() => {
          setEditing(null);
          void load();
        }}
        onSaved={(post) => setEditing({ post, isNew: false, saved: post })}
      />
    );
  }

  const shown = (posts ?? []).filter((p) => !query.trim() || p.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      {socialStatus?.linkedin && socialStatus.linkedin.ok === false && (
        <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          LinkedIn sharing needs attention: {socialStatus.linkedin.message}
        </div>
      )}

      <div className={panel}>
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center border-b border-l border-border bg-muted font-mono text-[13px] text-muted-foreground">BP</div>
        <div>
          <span className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground">Posts</span>
          <h3 className="text-base font-bold text-foreground font-serif">Blog Posts</h3>
          <p className="text-[13px] text-muted-foreground">
            Each post is saved on its own; there is no need to press Commit Draft. Saved changes go live in about 5–10 minutes.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles" className="pl-8 text-xs" />
          </div>
          <Button size="sm" onClick={() => setEditing({ post: emptyPost(doc(collection(db, "posts")).id), isNew: true, saved: null })}>
            <Plus className="h-3 w-3" /> New post
          </Button>
        </div>

        {loadError && <p className="rounded border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{loadError}</p>}
        {!posts && !loadError && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {posts && shown.length === 0 && <p className="text-xs text-muted-foreground">No posts yet.</p>}

        <ul className="divide-y divide-border rounded border border-border">
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <StateBadge state={postState(p)} />
              <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline" onClick={() => setEditing({ post: p, isNew: false, saved: p })}>
                {p.title || "(untitled)"}
              </button>
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"}
              </span>
              <ShareIcon name="X" share={p.shared?.x} href={xPostUrl(p.shared?.x?.id)} />
              <ShareIcon name="in" share={p.shared?.linkedin} href={linkedinPostUrl(p.shared?.linkedin?.id)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Post form ───────────────────────────────────────────────────────────────

function PostForm({
  initial,
  saved,
  isNew,
  others,
  people,
  publications,
  topics,
  allTags,
  xHandle,
  onClose,
  onSaved,
}: {
  initial: Post;
  saved: Post | null;
  isNew: boolean;
  others: Post[];
  people: string[];
  publications: PaperOption[];
  topics: { slug: string; title: string }[];
  allTags: string[];
  xHandle?: string;
  onClose: () => void;
  onSaved: (post: Post) => void;
}) {
  const [post, setPost] = useState<Post>(initial);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [authorInput, setAuthorInput] = useState("");
  const [guest, setGuest] = useState({ name: "", url: "" });
  const [tagText, setTagText] = useState((initial.tags ?? []).join(", "));
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = (patch: Partial<Post>) => setPost((p) => ({ ...p, ...patch }));
  const setSocial = (patch: Partial<NonNullable<Post["social"]>>) =>
    setPost((p) => ({ ...p, social: { autoShare: true, ...p.social, ...patch } }));

  // The slug follows the title until the post has been published once; after
  // that, links to it may be out in the world, so it only changes on purpose.
  const slugLocked = !!saved?.firstPublishedAt;
  const slug = post.slug || postSlug(post.title);
  const url = absoluteUrl(`/blog/${slug}`);
  const takenSlugs = new Set(others.flatMap((o) => [o.slug, ...(o.previousSlugs ?? [])]));
  const slugError = !slug ? "Add a title or slug." : takenSlugs.has(slug) ? "Another post already uses this URL." : !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? "Use lowercase letters, numbers and dashes." : null;
  const state = postState(post);
  const warnings = postWarnings({ ...post, slug });
  const xCopy = post.social?.xText ?? "";
  const xCount = xLength(xCopy.trim() || defaultXText(post));
  const shareImage = post.ogImage?.path || post.cover?.path;
  const shareImageSrc = shareImage ? shareImageUrl(getImageUrl(shareImage)) : undefined;
  const folder = `/blog/${slug || post.id}`;

  function addAuthor(a: PostAuthor) {
    if (!a.name.trim() || post.authors.some((x) => x.name === a.name)) return;
    set({ authors: [...post.authors, a] });
  }

  function insertAtCursor(text: string) {
    const el = bodyRef.current;
    const at = el?.selectionStart ?? post.body.length;
    set({ body: `${post.body.slice(0, at)}${text}${post.body.slice(at)}` });
  }

  async function save(patch: Partial<Post> = {}, message = "Saved. Live in about 5–10 minutes.") {
    if (slugError) {
      setNotice({ ok: false, text: slugError });
      return;
    }
    const now = new Date().toISOString();
    const next: Post = { ...post, ...patch, slug, updatedAt: now };
    if (next.status === "published") {
      next.publishedAt ||= now;
      next.firstPublishedAt ||= now;
    }
    setBusy(true);
    try {
      await savePost(next, isNew && !saved);
      setPost(next);
      setNotice({ ok: true, text: message });
      onSaved(next);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  function changeUrl() {
    const next = window.prompt(
      "New URL slug. The old address will forward to the new one, so links already shared keep working.",
      slug,
    );
    if (!next || next === slug) return;
    const clean = postSlug(next);
    set({ slug: clean, previousSlugs: [...new Set([...(post.previousSlugs ?? []), slug])].filter((s) => s !== clean) });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>
          <ArrowLeft className="h-3 w-3" /> All posts
        </Button>
        <StateBadge state={state} />
        <span className="flex-1" />
        {!isNew && post.status === "published" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Trash2 className="h-3 w-3" /> Unpublish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unpublish this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  It goes back to draft and disappears from the site at the next deploy (about 5–10 minutes). Anything
                  already posted to X or LinkedIn stays there and will link to a missing page; remove those by hand if
                  needed. Nothing is deleted, so you can publish it again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => save({ status: "draft" }, "Unpublished. Off the site in about 5–10 minutes.")}>Unpublish</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button size="sm" onClick={() => save()} disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
        </Button>
      </div>

      {notice && (
        <div className={`flex items-center justify-between rounded border p-3 text-xs ${notice.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-destructive/40 bg-destructive/5 text-destructive"}`}>
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><XIcon className="h-3 w-3" /></button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* ── Basics ── */}
          <div className={panel}>
            <div className="space-y-1">
              <div className="flex items-center justify-between"><Label className={label}>Title</Label><Counter n={post.title.length} max={70} /></div>
              <Input value={post.title} onChange={(e) => set({ title: e.target.value })} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className={label}>URL</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">/blog/</span>
                <Input
                  value={post.slug}
                  placeholder={postSlug(post.title)}
                  readOnly={slugLocked}
                  onChange={(e) => set({ slug: e.target.value })}
                  className="font-mono text-xs"
                />
                {slugLocked && <Button size="xs" variant="outline" onClick={changeUrl}>Change URL</Button>}
              </div>
              <p className={help}>
                {slugLocked
                  ? "Locked since the post was published. Changing it keeps the old address forwarding here."
                  : "Leave empty to follow the title. It locks once the post is published."}
                {(post.previousSlugs ?? []).length > 0 && ` Old addresses: ${(post.previousSlugs ?? []).join(", ")}.`}
              </p>
              {slugError && post.title && <p className="text-[11px] text-destructive">{slugError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className={label}>Status</Label>
                <select value={post.status} onChange={(e) => set({ status: e.target.value as Post["status"] })} className="h-8 w-full rounded border border-input bg-background px-2 text-xs">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className={label}>Publish date (your time)</Label>
                <Input type="datetime-local" value={toLocalInput(post.publishedAt)} onChange={(e) => set({ publishedAt: fromLocalInput(e.target.value) })} className="font-mono text-xs" />
                <p className={help}>{state === "Scheduled" ? "Scheduled: goes live at this time without anyone saving." : "Empty means now, when saved as Published."}</p>
              </div>
            </div>
          </div>

          {/* ── Summary and findings ── */}
          <div className={panel}>
            <div className="space-y-1">
              <div className="flex items-center justify-between"><Label className={label}>Summary</Label><Counter n={post.summary.trim().length} min={70} max={300} /></div>
              <textarea rows={3} value={post.summary} onChange={(e) => set({ summary: e.target.value })} className={textarea} />
              <p className={help}>1–3 plain sentences that make sense on their own. Used for search results, cards, the &quot;In short&quot; box and AI answers.</p>
            </div>
            <div className="space-y-2">
              <Label className={label}>Key findings (2–5)</Label>
              {(post.keyFindings ?? []).map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={f} onChange={(e) => set({ keyFindings: (post.keyFindings ?? []).map((x, j) => (j === i ? e.target.value : x)) })} className="text-xs" />
                  <Button size="icon-xs" variant="ghost" onClick={() => set({ keyFindings: (post.keyFindings ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button size="xs" variant="outline" onClick={() => set({ keyFindings: [...(post.keyFindings ?? []), ""] })}><Plus className="h-3 w-3" /> Add finding</Button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className={panel}>
            <div className="flex items-center gap-2">
              <Label className={label}>Body (Markdown)</Label>
              <span className="flex-1" />
              {(["write", "preview"] as const).map((t) => (
                <Button key={t} size="xs" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t === "write" ? "Write" : "Preview"}</Button>
              ))}
            </div>
            {tab === "write" ? (
              <>
                <textarea ref={bodyRef} rows={24} value={post.body} onChange={(e) => set({ body: e.target.value })} className={`${textarea} font-mono`} />
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Insert image</summary>
                  <div className="mt-2">
                    <ImageUploader
                      currentPath=""
                      folder={folder}
                      onUpload={(path) => {
                        const alt = window.prompt("Describe the image for people who can't see it (alt text):", "") ?? "";
                        insertAtCursor(`\n\n![${alt}](${path} "Caption (optional)")\n\n`);
                      }}
                    />
                  </div>
                </details>
                <p className={help}>
                  ## headings, **bold**, [links](https://…), lists, tables, $math$ and ```code``` all work. Paste a YouTube,
                  GitHub or arXiv link on its own line to show it as a card, or use a resource&apos;s shortcode.
                </p>
              </>
            ) : (
              <div className="rounded border border-border bg-background p-4">
                <Markdown body={post.body} resources={post.resources} />
              </div>
            )}
            <details className="rounded border border-border/80 bg-muted/40 p-3 text-xs">
              <summary className="cursor-pointer font-semibold">Writing so search engines and AI assistants find and quote the post</summary>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                <li>Lead with the answer: the summary and key findings should make sense without the rest.</li>
                <li>Use question-style ## headings where natural (&quot;What did we find?&quot;, &quot;Why does this matter?&quot;).</li>
                <li>State concrete facts, numbers, methods and limitations; link the paper (DOI/arXiv) and datasets.</li>
                <li>Name the authors and their roles; keep dates visible.</li>
                <li>One topic per post; 800–2,000 words is typical.</li>
              </ul>
            </details>
          </div>

          {/* ── People, tags, topic ── */}
          <div className={panel}>
            <div className="space-y-2">
              <Label className={label}>Authors</Label>
              <div className="flex flex-wrap gap-1.5">
                {post.authors.map((a) => (
                  <span key={a.name} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                    {a.name}{a.url ? " (guest)" : ""}
                    <button type="button" aria-label={`Remove ${a.name}`} onClick={() => set({ authors: post.authors.filter((x) => x.name !== a.name) })}><XIcon className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={authorInput}
                  list="blog-editor-people"
                  placeholder="Start typing a name from the People page"
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAuthor({ name: authorInput.trim() });
                      setAuthorInput("");
                    }
                  }}
                  className="text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => { addAuthor({ name: authorInput.trim() }); setAuthorInput(""); }}>Add</Button>
              </div>
              <datalist id="blog-editor-people">{people.map((p) => <option key={p} value={p} />)}</datalist>
              <div className="flex gap-2">
                <Input value={guest.name} placeholder="Guest author name" onChange={(e) => setGuest({ ...guest, name: e.target.value })} className="text-xs" />
                <Input value={guest.url} placeholder="Guest's website (optional)" onChange={(e) => setGuest({ ...guest, url: e.target.value })} className="text-xs" />
                <Button size="sm" variant="outline" onClick={() => { addAuthor({ name: guest.name.trim(), url: guest.url.trim() || undefined }); setGuest({ name: "", url: "" }); }}>Add guest</Button>
              </div>
              {post.authors.some((a) => !a.url && !people.includes(a.name)) && (
                <p className="text-[11px] text-amber-700">Some names aren&apos;t on the People page exactly; they&apos;ll show without a profile link.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className={label}>Tags (comma-separated)</Label>
              <Input
                value={tagText}
                list="blog-editor-tags"
                onChange={(e) => {
                  setTagText(e.target.value);
                  set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) });
                }}
                className="text-xs"
              />
              <datalist id="blog-editor-tags">{allTags.map((t) => <option key={t} value={`${tagText.replace(/[^,]*$/, "").trim()} ${t}`.trim()} />)}</datalist>
              {allTags.length > 0 && <p className={help}>In use: {allTags.join(", ")}</p>}
            </div>
            <div className="space-y-1">
              <Label className={label}>Related research topic</Label>
              <select value={post.researchTopicSlug ?? ""} onChange={(e) => set({ researchTopicSlug: e.target.value || undefined })} className="h-8 w-full rounded border border-input bg-background px-2 text-xs">
                <option value="">None</option>
                {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
              </select>
            </div>
          </div>

          {/* ── Images ── */}
          <div className={panel}>
            {(["cover", "ogImage"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label className={label}>{key === "cover" ? "Cover image" : "Share image override (optional; 1200×630 crop)"}</Label>
                <ImageUploader
                  currentPath={post[key]?.path ?? ""}
                  folder={folder}
                  onUpload={(path) => set({ [key]: { path, alt: post[key]?.alt ?? "" } })}
                  onDelete={async () => set({ [key]: undefined })}
                />
                {post[key]?.path && (
                  <Input value={post[key]?.alt ?? ""} placeholder="Alt text: what the image shows" onChange={(e) => set({ [key]: { path: post[key]!.path, alt: e.target.value } })} className="text-xs" />
                )}
              </div>
            ))}
          </div>

          {/* ── Resources ── */}
          <div className={panel}>
            <div>
              <h3 className="text-sm font-bold">Paper, code, videos and data</h3>
              <p className={help}>Shown as buttons under the title and as cards at the end. Star marks the one shown first for each kind.</p>
            </div>
            <ResourcesEditor resources={post.resources ?? []} onChange={(resources) => set({ resources })} people={people} publications={publications} folder={folder} />
          </div>

          {/* ── Social ── */}
          <div className={panel}>
            <div className="flex items-center justify-between rounded border border-border/80 bg-muted/40 p-3">
              <div>
                <Label htmlFor="auto-share" className="text-xs font-mono uppercase font-semibold">Share automatically on X and LinkedIn</Label>
                <p className={help}>Posted once the post is live. Posts older than 7 days are skipped unless you press Share now.</p>
              </div>
              <Switch id="auto-share" checked={post.social?.autoShare ?? true} onCheckedChange={(c) => setSocial({ autoShare: c })} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className={label}>X text (the link is added after)</Label>
                <Counter n={xCount} max={X_BUDGET} />
              </div>
              <textarea rows={4} value={xCopy} placeholder={defaultXText(post)} onChange={(e) => setSocial({ xText: e.target.value || undefined })} className={textarea} />
              <Button size="xs" variant="outline" onClick={() => setSocial({ xText: defaultXText(post) })}>Fill from title and summary</Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className={label}>LinkedIn text (the link is added after)</Label>
                <Counter n={(post.social?.linkedinText ?? "").length} max={2900} />
              </div>
              <textarea rows={5} value={post.social?.linkedinText ?? ""} placeholder={defaultLinkedinText(post)} onChange={(e) => setSocial({ linkedinText: e.target.value || undefined })} className={textarea} />
              <div className="flex flex-wrap gap-2">
                <Button size="xs" variant="outline" onClick={() => setSocial({ linkedinText: defaultLinkedinText(post) })}>Fill from title and summary</Button>
                {/* Until the LinkedIn API is approved, someone can post by hand with these two. */}
                <Button size="xs" variant="outline" asChild>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3" /> Open LinkedIn share
                  </a>
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(buildLinkedinText(post, url)).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy LinkedIn text
                </Button>
              </div>
            </div>
            {!isNew && state === "Published" && (
              <div className="flex items-center justify-between gap-3 rounded border border-border/80 p-3">
                <p className={help}>
                  {post.social?.shareNow
                    ? "Queued: will be shared after the next deploy, even though it's older than 7 days."
                    : "Share this post on the next run even if it was published more than 7 days ago."}
                </p>
                <Button size="xs" variant="outline" disabled={busy || post.social?.shareNow} onClick={() => save({ social: { autoShare: true, ...post.social, shareNow: true } }, "Queued for sharing after the next deploy.")}>
                  <Send className="h-3 w-3" /> Share now
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Previews and checks ── */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className={panel}>
            <h3 className="text-sm font-bold">Checks</h3>
            {warnings.length === 0 ? (
              <p className="text-xs text-emerald-700">Looks good.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-4 text-xs text-amber-800">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            )}
          </div>

          <div className={panel}>
            <h3 className="text-sm font-bold">Google</h3>
            <div className="space-y-0.5">
              <p className="truncate text-[11px] text-emerald-800">{url.replace(/^https:\/\//, "").replace(/\//g, " › ")}</p>
              <p className="text-base leading-snug text-[#1a0dab]">{post.title.length > 60 ? `${post.title.slice(0, 59)}…` : post.title || "Title"}</p>
              <p className="text-xs text-muted-foreground">{post.summary.length > 155 ? `${post.summary.slice(0, 154)}…` : post.summary || "Summary"}</p>
            </div>
          </div>

          <div className={panel}>
            <h3 className="text-sm font-bold">X{xHandle ? ` (${xHandle})` : ""}</h3>
            <p className="whitespace-pre-wrap text-xs">{(xCopy.trim() || defaultXText(post))}</p>
            <SharePreviewCard image={shareImageSrc} title={post.title} domain="thirdspace-uoft.github.io" />
          </div>

          <div className={panel}>
            <h3 className="text-sm font-bold">LinkedIn</h3>
            <p className="line-clamp-4 whitespace-pre-wrap text-xs">{(post.social?.linkedinText ?? "").trim() || defaultLinkedinText(post)}</p>
            <SharePreviewCard image={shareImageSrc} title={post.title} domain="thirdspace-uoft.github.io" />
            {!shareImageSrc && <p className={help}>No cover or share image: the generated title card is used.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SharePreviewCard({ image, title, domain }: { image?: string; title: string; domain: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview
        <img src={image} alt="" className="aspect-[1200/630] w-full object-cover" />
      ) : (
        <div className="flex aspect-[1200/630] w-full items-end bg-[#B21F2D] p-3 text-sm font-bold text-white">{title || "Title"}</div>
      )}
      <div className="p-2">
        <p className="text-[10px] text-muted-foreground">{domain}</p>
        <p className="line-clamp-2 text-xs font-semibold">{title || "Title"}</p>
      </div>
    </div>
  );
}
