import { getContent } from "@/lib/content";

export type HiringMode = "online" | "offline" | "hybrid";

export const HIRING_MODES: HiringMode[] = ["online", "offline", "hybrid"];

/** Sent to the candidate by the mailer (`scripts/send-applications.mjs`) right after they apply. */
export type HiringAssignment = {
  autoSend?: boolean;
  subject?: string;
  /** Plain text; blank lines separate paragraphs. */
  body?: string;
  url?: string;
};

export type HiringListing = {
  id?: string;
  /** Deep link: /contact#position-<slug>. */
  slug?: string;
  title?: string;
  /** e.g. "Research Assistant · Undergraduate". */
  type?: string;
  /** One line on the position row. */
  summary?: string;
  /** Paragraphs separated by blank lines; supports [text](url) links. */
  description?: string;
  mode?: HiringMode;
  mentor?: string;
  /** e.g. "8–10 h / week · Winter 2027". */
  commitment?: string;
  /** YYYY-MM-DD; applications close at the end of that day. */
  deadline?: string;
  /** false hides the listing. */
  open?: boolean;
  /** Who receives the applications. Empty → the section's default contact. */
  contactName?: string;
  contactEmail?: string;
  assignment?: HiringAssignment;
};

export type HiringStep = { title?: string; body?: string };

export type HiringFormLabels = {
  name?: string;
  email?: string;
  cvUrl?: string;
  cvHint?: string;
  message?: string;
  messageHint?: string;
  submit?: string;
  submitting?: string;
  success?: string;
  error?: string;
  invalid?: string;
  privacyNote?: string;
};

export type HiringLabels = {
  modes?: Partial<Record<HiringMode, string>>;
  mentor?: string;
  commitment?: string;
  deadline?: string;
  contact?: string;
  positionsHeading?: string;
  processHeading?: string;
  viewDetails?: string;
  apply?: string;
  closed?: string;
  close?: string;
  form?: HiringFormLabels;
  /** Copy in the assignment email the mailer sends to applicants. */
  email?: HiringEmailLabels;
};

export type HiringEmailLabels = {
  /** Button text for the assignment link. */
  assignmentLink?: string;
  /** Note at the end of the email; {contact} becomes the contact person's name. */
  replyNote?: string;
};

export type HiringContent = {
  /** Turns the hiring section on /contact on or off. */
  enabled?: boolean;
  heading?: string;
  /** Supports [text](url) links. */
  intro?: string;
  emptyLabel?: string;
  defaultContactName?: string;
  defaultContactEmail?: string;
  process?: HiringStep[];
  labels?: HiringLabels;
  listings?: HiringListing[];
};

/**
 * Size limits for an application. `firestore.rules` and
 * `scripts/lib/applications-mail.mjs` enforce the same numbers.
 */
export const APPLICATION_LIMITS = {
  name: 200,
  email: 254,
  cvUrl: 500,
  message: 4000,
} as const;

/** `hiring` is not in the generated content.json type until it exists in Firestore. */
export function getHiring(): HiringContent {
  return ((getContent() as { hiring?: HiringContent }).hiring ?? {}) as HiringContent;
}

/** Listings shown on the site, in admin order. */
export function openListings(hiring: HiringContent): HiringListing[] {
  return (hiring.listings ?? []).filter((l) => l.open !== false && l.title && l.slug);
}

/** The listing's own contact, or the section default. */
export function listingContact(listing: HiringListing, hiring: HiringContent) {
  return {
    name: listing.contactName?.trim() || hiring.defaultContactName?.trim() || "",
    email: listing.contactEmail?.trim() || hiring.defaultContactEmail?.trim() || "",
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-11-30" → "Nov 30, 2026". Parsed by hand: `new Date("2026-11-30")` is
 * UTC midnight, which is the previous day anywhere west of UTC.
 */
export function formatDeadline(deadline?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline ?? "");
  if (!m) return deadline ?? "";
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : deadline ?? "";
}

/** True once the local date is after the deadline day. */
export function isPastDeadline(deadline: string | undefined, now = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline ?? "");
  if (!m) return false;
  const endOfDay = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  return now > endOfDay;
}

/** Plain addresses only (no quotes, comments or trailing dots); matches firestore.rules and the mailer. */
export const EMAIL_PATTERN =
  /^[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
export const URL_PATTERN = /^https?:\/\/\S+$/i;
