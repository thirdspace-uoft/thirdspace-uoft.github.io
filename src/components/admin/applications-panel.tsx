"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, type Timestamp } from "firebase/firestore";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import type { HiringListing } from "@/lib/hiring";

type Application = {
  id: string;
  listingId?: string;
  listingTitle?: string;
  name?: string;
  email?: string;
  cvUrl?: string;
  message?: string;
  status?: "new" | "sending" | "sent" | "failed" | "skipped";
  createdAt?: Timestamp;
  notifiedAt?: Timestamp;
  notifiedTo?: string;
  assignmentSentAt?: Timestamp;
  skipReason?: string;
  error?: string;
  attempts?: number;
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-accent/15 text-accent-foreground",
  sending: "bg-accent/15 text-accent-foreground",
  sent: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  skipped: "bg-muted text-muted-foreground",
};

const when = (ts?: Timestamp) => (ts?.toDate ? ts.toDate().toLocaleString() : "—");

/**
 * The CV link as an http(s) URL, or null. firestore.rules already rejects
 * other schemes, but this page runs with an admin session, so a value that got
 * in some other way (Admin SDK, older data) must never become a live
 * `javascript:` link here.
 */
function safeHttpUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Applications live in their own Firestore collection, not in `config/site`,
 * so they are read here directly and never touched by Publish. Reading needs a
 * signed-in admin (firestore.rules).
 */
export function ApplicationsPanel({ listings }: { listings: HiringListing[] }) {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // State is only set from the promise callbacks, never synchronously.
  const fetchApplications = useCallback(
    () =>
      getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc"), limit(200)))
        .then((snap) => {
          setApps(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Application, "id">) })));
          setError(null);
        })
        .catch((err) => {
          // permission-denied here means firestore.rules (with the
          // `applications` block) has not been deployed yet.
          if ((err as { code?: string })?.code === "permission-denied") {
            setError(
              "Firestore refused to list applications (permission denied). Deploy firestore.rules — `npx firebase-tools deploy --only firestore:rules` — then refresh.",
            );
            return;
          }
          console.error("Failed to load applications", err);
          setError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const load = () => {
    setLoading(true);
    void fetchApplications();
  };

  const remove = async (app: Application) => {
    if (!window.confirm(`Delete the application from ${app.name || app.email}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "applications", app.id));
      setApps((list) => (list ?? []).filter((a) => a.id !== app.id));
    } catch (err) {
      window.alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const shown = (apps ?? []).filter((a) => filter === "all" || a.listingId === filter);
  const titleFor = (a: Application) =>
    listings.find((l) => (l.id ?? l.slug) === a.listingId)?.title || a.listingTitle || a.listingId;

  return (
    <div className="relative bg-card border border-border rounded p-6 shadow-sm space-y-4">
      <div className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center border-b border-l border-border bg-muted font-mono text-[13px] text-muted-foreground">H4</div>
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div>
          <h3 className="text-base font-bold text-foreground font-serif">Applications</h3>
          <p className="text-[13px] text-muted-foreground">
            Newest first (last 200). Status: new → sent by the mailer; skipped = position missing/closed or invalid; failed is retried up to 3 times.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-7 rounded border border-input bg-background px-2 font-mono text-xs text-foreground focus:outline-none focus:border-ring"
          >
            <option value="all">All positions</option>
            {listings.map((l) => (
              <option key={l.id ?? l.slug} value={l.id ?? l.slug}>{l.title || "Untitled position"}</option>
            ))}
          </select>
          <Button size="xs" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
          </Button>
        </div>
      </div>

      {error && <p className="rounded border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">{error}</p>}

      {apps && shown.length === 0 && !error && (
        <p className="font-mono text-xs text-muted-foreground">No applications{filter === "all" ? "" : " for this position"} yet.</p>
      )}

      <ul className="divide-y divide-border rounded border border-border">
        {shown.map((a) => {
          const open = openId === a.id;
          return (
            <li key={a.id} className="text-xs">
              <button type="button" onClick={() => setOpenId(open ? null : a.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left hover:bg-muted/40">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${STATUS_STYLE[a.status ?? "new"] ?? STATUS_STYLE.new}`}>{a.status ?? "new"}</span>
                <span className="font-semibold text-foreground">{a.name}</span>
                <span className="font-mono text-muted-foreground">{a.email}</span>
                <span className="text-muted-foreground">· {titleFor(a)}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{when(a.createdAt)}</span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-border bg-muted/20 px-3 py-3">
                  {a.cvUrl &&
                    (safeHttpUrl(a.cvUrl) ? (
                      <a href={safeHttpUrl(a.cvUrl)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-primary underline underline-offset-2">
                        {a.cvUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-muted-foreground">{a.cvUrl} (not an http(s) link)</span>
                    ))}
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground">{a.message}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <dt>Emailed to</dt><dd>{a.notifiedTo ? `${a.notifiedTo} · ${when(a.notifiedAt)}` : "—"}</dd>
                    <dt>Assignment</dt><dd>{a.assignmentSentAt ? `sent ${when(a.assignmentSentAt)}` : "—"}</dd>
                    {a.skipReason && (<><dt>Skipped</dt><dd>{a.skipReason}</dd></>)}
                    {a.error && (<><dt>Error</dt><dd className="text-destructive">{a.error} (attempts: {a.attempts ?? 0})</dd></>)}
                  </dl>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" asChild>
                      <a href={`mailto:${a.email}`}>Reply</a>
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => void remove(a)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
