import { getContent } from "@/lib/content";
import { memberAnchor } from "@/lib/people";
import type { ResearchMedia } from "@/lib/research";

/**
 * "Find us" (issue #4): the conferences lab members attend, so people can book a
 * meeting with us there. Shown on /contact after the hiring section.
 */
export type Conference = {
  id?: string;
  /** Stable part of the deep link /contact#conference-<slug>. */
  slug?: string;
  /** Short name, e.g. "CHI 2027". */
  name?: string;
  /** e.g. "ACM CHI Conference on Human Factors in Computing Systems". */
  fullName?: string;
  /** YYYY-MM-DD. */
  startDate?: string;
  /** YYYY-MM-DD; the same as startDate (or empty) for one-day events. */
  endDate?: string;
  /** e.g. "Barcelona, Spain". */
  location?: string;
  websiteUrl?: string;
  /** Overrides the lab Calendly link for this conference. */
  calendlyUrl?: string;
  /** One line, e.g. "Presenting two papers and a workshop". */
  note?: string;
  /** People keys: "pi" for the PI, otherwise memberAnchor(role, name). */
  attendees?: string[];
  /** Comma-separated names of guests, alumni or collaborators. */
  guests?: string;
  photos?: ResearchMedia[];
};

export type FindUsLabels = {
  upcomingHeading?: string;
  pastHeading?: string;
  emptyUpcoming?: string;
  emptyPast?: string;
  allYears?: string;
  /** Above the attendees of an upcoming conference ("Who's going"). */
  attendees?: string;
  /** Before the attendees of a past conference ("Who went"). */
  pastAttendees?: string;
  bookMeeting?: string;
  conferenceSite?: string;
  photos?: string;
  /** Button for a past conference that only has figures from our research (no uploaded photos). */
  researchFigures?: string;
  /** Shown in the gallery for research figures; {topics} becomes links to the research topics. */
  researchFiguresNote?: string;
  showMore?: string;
  showLess?: string;
  close?: string;
  previous?: string;
  next?: string;
  goToSlide?: string;
  /** Text on the generated share image. */
  shareEyebrow?: string;
  shareCta?: string;
  shareScan?: string;
};

export type FindUsContent = {
  enabled?: boolean;
  heading?: string;
  /** Supports [text](url) links. */
  intro?: string;
  /** The lab's Calendly link, used when a conference has none of its own. */
  calendlyUrl?: string;
  labels?: FindUsLabels;
  conferences?: Conference[];
};

/** `findUs` is not in the generated content.json type until it exists in Firestore. */
export function getFindUs(): FindUsContent {
  return ((getContent() as { findUs?: FindUsContent }).findUs ?? {}) as FindUsContent;
}

// ── Dates ───────────────────────────────────────────────────────────────────
// Parsed by hand: new Date("2027-04-26") is UTC midnight, the previous day
// anywhere west of UTC.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Ymd = { y: number; m: number; d: number };

export function parseYmd(value?: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 ? { y, m, d } : null;
}

const ymdNumber = (v: Ymd) => v.y * 10000 + v.m * 100 + v.d;

/** Today as YYYYMMDD in local time. */
export function todayNumber(now = new Date()): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/** "Apr 26–30, 2027", "Apr 28 – May 2, 2027", "Dec 30, 2026 – Jan 2, 2027", "Apr 26, 2027". */
export function formatDateRange(start?: string, end?: string): string {
  const s = parseYmd(start);
  const e = parseYmd(end) ?? s;
  if (!s || !e) return start ?? "";
  const mon = (v: Ymd) => MONTHS[v.m - 1];
  if (ymdNumber(s) === ymdNumber(e)) return `${mon(s)} ${s.d}, ${s.y}`;
  if (s.y !== e.y) return `${mon(s)} ${s.d}, ${s.y} – ${mon(e)} ${e.d}, ${e.y}`;
  if (s.m !== e.m) return `${mon(s)} ${s.d} – ${mon(e)} ${e.d}, ${s.y}`;
  return `${mon(s)} ${s.d}–${e.d}, ${s.y}`;
}

/** The short month and day part of the date badge: { month: "Apr", days: "26–30", year: 2027 }. */
export function dateBadge(start?: string, end?: string) {
  const s = parseYmd(start);
  const e = parseYmd(end) ?? s;
  if (!s || !e) return null;
  const sameDay = ymdNumber(s) === ymdNumber(e);
  const sameMonth = s.y === e.y && s.m === e.m;
  return {
    month: sameMonth ? MONTHS[s.m - 1] : `${MONTHS[s.m - 1]}–${MONTHS[e.m - 1]}`,
    days: sameDay ? `${s.d}` : `${s.d}–${e.d}`,
    year: s.y,
  };
}

/** A conference is past once its last day is over. Undated ones count as upcoming. */
export function isPast(conference: Conference, today: number): boolean {
  const end = parseYmd(conference.endDate) ?? parseYmd(conference.startDate);
  return end ? ymdNumber(end) < today : false;
}

export function conferenceYear(conference: Conference): number | null {
  return parseYmd(conference.startDate)?.y ?? null;
}

const startKey = (c: Conference) => {
  const s = parseYmd(c.startDate);
  return s ? ymdNumber(s) : 99999999;
};

/** Upcoming soonest first, past most recent first. */
export function splitConferences(conferences: Conference[], today: number) {
  const listed = conferences.filter((c) => c.name?.trim());
  const upcoming = listed.filter((c) => !isPast(c, today)).sort((a, b) => startKey(a) - startKey(b));
  const past = listed.filter((c) => isPast(c, today)).sort((a, b) => startKey(b) - startKey(a));
  return { upcoming, past };
}

// ── Links ───────────────────────────────────────────────────────────────────

const HTTP = /^https?:\/\/\S+$/i;
export const httpUrl = (value?: string) => (HTTP.test(value?.trim() ?? "") ? value!.trim() : "");

/** Where "Book a meeting" goes for a conference: its own Calendly link, else the lab's. */
export function bookingUrl(conference: Conference | undefined, findUs: FindUsContent): string {
  return httpUrl(conference?.calendlyUrl) || httpUrl(findUs.calendlyUrl);
}

// ── People ──────────────────────────────────────────────────────────────────

export type Person = {
  /** "pi" or memberAnchor(role, name). */
  key: string;
  name: string;
  role: string;
  imagePath?: string;
  /** /people#… for the profile; the PI has their own row at /people. */
  href: string;
};

type TeamSection = { role?: string; members?: { name?: string; title?: string; imagePath?: string }[] };

/** Everyone who can be listed as attending: the PI, then each People section in order. */
export function peopleOptions(content = getContent() as Record<string, unknown>): Person[] {
  const professor = (content.professor ?? {}) as { name?: string; title?: string; imagePath?: string };
  const sections = ((content.team as { sections?: TeamSection[] } | undefined)?.sections ?? []) as TeamSection[];
  const people: Person[] = [];
  if (professor.name) {
    people.push({ key: "pi", name: professor.name, role: professor.title ?? "", imagePath: professor.imagePath, href: "/people" });
  }
  for (const section of sections) {
    for (const member of section.members ?? []) {
      if (!member.name || !section.role) continue;
      const anchor = memberAnchor(section.role, member.name);
      people.push({ key: anchor, name: member.name, role: section.role, imagePath: member.imagePath, href: `/people#${anchor}` });
    }
  }
  return people;
}

/** The attendees of a conference, in the order picked; unknown keys (people who left) are dropped. */
export function resolveAttendees(conference: Conference, people: Person[]): Person[] {
  const byKey = new Map(people.map((p) => [p.key, p]));
  return (conference.attendees ?? []).map((key) => byKey.get(key)).filter((p): p is Person => !!p);
}

// ── Images from the lab's research ──────────────────────────────────────────

/** "EMNLP 2026 (Findings)" → "EMNLP 2026" (same rule as scripts/lib/conferences-source.mjs). */
export const venueKey = (venue?: string) =>
  String(venue ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type ResearchFigures = {
  media: ResearchMedia[];
  /** The research topics the figures come from, for "from our research on …" links. */
  topics: { slug: string; title: string }[];
};

type ResearchLike = {
  topics?: {
    slug?: string;
    title?: string;
    sections?: { figure?: { media?: ResearchMedia[] }; papers?: { venue?: string }[] }[];
  }[];
};

/**
 * Figures from the Research pages that sit next to a lab paper presented at
 * this conference: every research section citing a paper whose venue is the
 * conference contributes its figure images (deduplicated, at most `limit`).
 * These are research figures, not photos of the event, and are labelled so.
 */
export function researchFigures(conference: Conference, research: ResearchLike, limit = 6): ResearchFigures {
  const name = conference.name?.trim().toLowerCase();
  const media: ResearchMedia[] = [];
  const seen = new Set<string>();
  const topics = new Map<string, string>();
  if (!name) return { media, topics: [] };
  for (const topic of research.topics ?? []) {
    for (const section of topic.sections ?? []) {
      if (!(section.papers ?? []).some((p) => venueKey(p.venue).toLowerCase() === name)) continue;
      for (const m of section.figure?.media ?? []) {
        if ((m.type ?? "image") !== "image" || !m.path || seen.has(m.path) || media.length >= limit) continue;
        seen.add(m.path);
        media.push(m);
        if (topic.slug) topics.set(topic.slug, topic.title ?? topic.slug);
      }
    }
  }
  return { media, topics: [...topics].map(([slug, title]) => ({ slug, title })) };
}

export function guestNames(conference: Conference): string[] {
  return (conference.guests ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
