/**
 * Pure helpers for scripts/send-applications.mjs: deciding whether an
 * application can be sent, and building the two emails.
 *
 *   notification → the listing's contact person, reply-to = the applicant
 *   assignment   → the applicant (only when the listing's assignment.autoSend
 *                  is on), reply-to = the contact person
 */

import { DEFAULT_THEME } from "./email-theme.mjs";

/** Same numbers as APPLICATION_LIMITS in src/lib/hiring.ts and firestore.rules. */
export const LIMITS = { name: 200, email: 254, cvUrl: 500, message: 4000 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL = /^https?:\/\/\S+$/i;

/** The listing's own contact, or the section default. */
export function pickContact(listing = {}, hiring = {}) {
  return {
    name: listing.contactName?.trim() || hiring.defaultContactName?.trim() || "",
    email: listing.contactEmail?.trim() || hiring.defaultContactEmail?.trim() || "",
  };
}

/** The listing an application was made for (by id, or slug for old ids). */
export function findListing(app, hiring = {}) {
  return (hiring.listings ?? []).find((l) => (l.id ?? l.slug) === app.listingId || l.slug === app.listingId);
}

/** Why an application must not be sent, or null when it can be. */
export function skipReason(app, listing, hiring) {
  if (!listing) return "listing not found";
  if (listing.open === false) return "listing closed";
  if (!EMAIL.test(pickContact(listing, hiring).email)) {
    return "listing has no valid contact email";
  }
  const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  if (!str(app.name, LIMITS.name)) return "invalid name";
  if (!str(app.email, LIMITS.email) || !EMAIL.test(app.email.trim())) return "invalid email";
  if (!str(app.cvUrl, LIMITS.cvUrl) || !URL.test(app.cvUrl.trim())) return "invalid CV link";
  if (!str(app.message, LIMITS.message)) return "invalid message";
  return null;
}

/** Lower-cased, trimmed address, for spotting repeat applications. */
export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

/** Removes CR/LF so a value can't add headers when used in a subject. */
const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The applicant's name, reduced to letters, spaces and . ' - (60 chars max).
 * The assignment email goes to an address nobody has verified, so anything
 * the applicant typed must not be able to carry a link or other payload into
 * mail sent from the lab's account.
 */
export function safeName(name) {
  return String(name ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{M} .'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** `{name}` and `{position}` in assignment text become the applicant's (sanitized) name and the listing title. */
export function fillTemplate(text, app, listing) {
  return String(text ?? "")
    .replace(/\{name\}/g, safeName(app.name))
    .replace(/\{position\}/g, listing.title ?? "");
}

const address = (name, email) => (name ? `"${oneLine(name).replace(/"/g, "'")}" <${email}>` : email);

/** An http(s) URL, or "" — anything else must never become a link. */
const httpUrl = (value) => (URL.test(String(value ?? "").trim()) ? String(value).trim() : "");

// ── HTML layout ─────────────────────────────────────────────────────────────
// Table-based, inline styles only: what Gmail, Outlook and Apple Mail all
// render. Colours come from the site's tokens (scripts/lib/email-theme.mjs).

export const DEFAULT_SITE_URL = "https://thirdspace-uoft.github.io";

/**
 * Inline logo for the emails: scripts/assets/email-logo.png, a trimmed copy of
 * public/long_logo.webp flattened onto white (280 px wide, shown at 140).
 * Regenerate after a logo change with:
 *   node -e "const s=require('sharp');s('public/long_logo.webp').trim().toBuffer().then(b=>s(b).resize({width:280}).flatten({background:'#ffffff'}).png({palette:true}).toFile('scripts/assets/email-logo.png'))"
 */
export const LOGO_CONTENT_ID = "thirdspace-logo";

/** The Resend attachment that backs `cid:thirdspace-logo`, from the PNG's bytes. */
export function logoAttachment(pngBytes) {
  return { content: Buffer.from(pngBytes).toString("base64"), filename: "thirdspace-logo.png", contentId: LOGO_CONTENT_ID };
}

/** `site.logo` for an email that carries logoAttachment(). */
export const INLINE_LOGO = { src: `cid:${LOGO_CONTENT_ID}`, width: 140 };

/** Copy for the applicant-facing email, editable under hiring.labels.email. */
const EMAIL_LABEL_DEFAULTS = {
  assignmentLink: "Open the assignment",
  replyNote: "Questions? Reply to this email and it goes straight to {contact}.",
};

const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Paragraphs from plain text; bare http(s) URLs become links (only for trusted, admin-written text). */
function paragraphsHtml(text, t, { linkify = false } = {}) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      let html = escapeHtml(p);
      if (linkify) {
        html = html.replace(
          /https?:\/\/[^\s<]+/g,
          (u) => `<a href="${u}" style="color:${t.primary};text-decoration:underline;">${u}</a>`,
        );
      }
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${t.foreground};">${html.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function button(href, label, t, { variant = "primary" } = {}) {
  const solid = variant === "primary";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 20px;border-radius:10px;font-family:${FONT};font-size:14px;font-weight:600;text-decoration:none;${
    solid
      ? `background:${t.primary};color:${t.primaryForeground};border:1px solid ${t.primary};`
      : `background:${t.card};color:${t.foreground};border:1px solid ${t.border};`
  }">${escapeHtml(label)}</a>`;
}

/**
 * The shared frame: brand bar, logo, eyebrow + heading, content, footer with the
 * group's address (all from Firestore `brand` / `location`).
 */
function layout({ t, site, preheader, eyebrow, heading, content }) {
  const brand = site.brand ?? {};
  const loc = site.location ?? {};
  const siteUrl = site.siteUrl || DEFAULT_SITE_URL;
  const name = escapeHtml(brand.name || "ThirdSpace");
  // The mailer embeds a white-backed PNG as an inline (cid:) attachment: Gmail's
  // image proxy turns the transparent parts of the site's WebP logo black.
  const logo = site.logo?.src ? site.logo : { src: `${siteUrl}/long_logo.webp`, width: 160 };
  const footerLines = [
    [brand.name, brand.tagline].filter(Boolean).join(" · "),
    [loc.institution, loc.street].filter(Boolean).join(", "),
    loc.cityCountry,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${t.background};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${t.background};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${t.card};border:1px solid ${t.border};border-radius:16px;overflow:hidden;font-family:${FONT};color:${t.foreground};">
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${t.primary};">&nbsp;</td></tr>
    <tr><td style="padding:24px 32px 0;">
      <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
        <img src="${escapeHtml(logo.src)}" width="${logo.width}" alt="${name}" style="display:block;height:auto;border:0;max-width:${logo.width}px;color:${t.primary};font-family:${FONT};font-size:18px;font-weight:700;">
      </a>
    </td></tr>
    <tr><td style="padding:22px 32px 4px;">
      <p style="margin:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedForeground};">${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${t.foreground};">${escapeHtml(heading)}</h1>
    </td></tr>
    <tr><td style="padding:18px 32px 28px;">
${content}
    </td></tr>
    <tr><td style="padding:18px 32px;background:${t.muted};border-top:1px solid ${t.border};font-size:12px;line-height:1.6;color:${t.mutedForeground};">
      ${footerLines}<br>
      <a href="${escapeHtml(siteUrl)}" style="color:${t.primary};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/** One "label — value" row of the details table. */
const detailRow = (label, valueHtml, t) =>
  `<tr><td style="padding:9px 0;border-bottom:1px solid ${t.border};width:120px;vertical-align:top;font-size:13px;color:${t.mutedForeground};">${escapeHtml(label)}</td><td style="padding:9px 0;border-bottom:1px solid ${t.border};vertical-align:top;font-size:14px;font-weight:600;color:${t.foreground};">${valueHtml}</td></tr>`;

/**
 * @param {{ app: object, listing: object, hiring: object, from: string, fromName?: string, submittedAt?: string, site?: object, theme?: object }} input
 */
export function notificationEmail({ app, listing, hiring, from, fromName, submittedAt, site = {}, theme = DEFAULT_THEME }) {
  const contact = pickContact(listing, hiring);
  const name = app.name.trim();
  const text = [
    `New application for "${listing.title}".`,
    "",
    `Name: ${name}`,
    `Email: ${app.email.trim()}`,
    `CV / portfolio: ${app.cvUrl.trim()}`,
    submittedAt ? `Submitted: ${submittedAt}` : null,
    "",
    "Message:",
    app.message.trim(),
    "",
    "Reply to this email to answer the applicant directly.",
    listing.assignment?.autoSend ? "The assignment for this position was sent to them automatically." : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  // Internal email to the lab: applicant text is escaped, never linkified; the
  // only links are the validated CV URL and a mailto to the applicant.
  const t = theme;
  const email = app.email.trim();
  const cv = httpUrl(app.cvUrl);
  const subject = oneLine(`Application: ${listing.title} — ${name}`);
  const replyHref = `mailto:${email}?subject=${encodeURIComponent(`Re: ${listing.title}`)}`;
  const siteUrl = site.siteUrl || DEFAULT_SITE_URL;
  const content = `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${t.mutedForeground};">${escapeHtml(name)} applied through the hiring section on the website.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${t.border};margin:0 0 22px;">
        ${detailRow("Name", escapeHtml(name), t)}
        ${detailRow("Email", `<a href="mailto:${escapeHtml(email)}" style="color:${t.primary};text-decoration:none;">${escapeHtml(email)}</a>`, t)}
        ${detailRow("CV / portfolio", cv ? `<a href="${escapeHtml(cv)}" style="color:${t.primary};text-decoration:underline;word-break:break-all;">${escapeHtml(cv)}</a>` : "—", t)}
        ${submittedAt ? detailRow("Submitted", escapeHtml(new Date(submittedAt).toUTCString()), t) : ""}
      </table>
      <p style="margin:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.mutedForeground};">Message</p>
      <div style="margin:0 0 24px;padding:16px 18px;background:${t.muted};border-left:3px solid ${t.primary};border-radius:0 10px 10px 0;font-size:15px;line-height:1.65;color:${t.foreground};white-space:pre-wrap;">${escapeHtml(app.message.trim())}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:0 10px 10px 0;">${button(replyHref, `Reply to ${name}`, t)}</td>
        ${cv ? `<td style="padding:0 0 10px;">${button(cv, "View CV", t, { variant: "secondary" })}</td>` : ""}
      </tr></table>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${t.mutedForeground};">
        ${listing.assignment?.autoSend ? "The assignment for this position was emailed to them automatically. " : ""}All applications are listed in <a href="${escapeHtml(siteUrl)}/admin" style="color:${t.primary};">/admin → Hiring</a>.
      </p>`;

  return {
    from: address(fromName, from),
    to: address(contact.name, contact.email),
    replyTo: address(name, email),
    subject,
    text,
    html: layout({
      t,
      site,
      preheader: `${name} applied for ${listing.title}`,
      eyebrow: "New application",
      heading: listing.title ?? "",
      content,
    }),
  };
}

/** The assignment email, or null when the listing does not auto-send one. */
export function assignmentEmail({ app, listing, hiring, from, fromName, site = {}, theme = DEFAULT_THEME }) {
  const a = listing.assignment ?? {};
  if (!a.autoSend || !a.subject?.trim() || !(a.body?.trim() || a.url?.trim())) return null;
  const contact = pickContact(listing, hiring);
  const labels = { ...EMAIL_LABEL_DEFAULTS, ...(hiring.labels?.email ?? {}) };
  const body = fillTemplate(a.body, app, listing).trim();
  const url = httpUrl(a.url);
  const subject = oneLine(fillTemplate(a.subject, app, listing));
  const replyNote = String(labels.replyNote || "").replace(/\{contact\}/g, contact.name || contact.email);
  const text = [body, url, replyNote].filter(Boolean).join("\n\n");

  // Goes to an unverified address: the body is admin-written (so its URLs may be
  // linked), and {name} has already been reduced by safeName().
  const t = theme;
  const content = `
      ${paragraphsHtml(body, t, { linkify: true })}
      ${url ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px;"><tr><td>${button(url, labels.assignmentLink, t)}</td></tr></table>` : ""}
      ${replyNote ? `<p style="margin:22px 0 0;padding:14px 16px;background:${t.muted};border-radius:10px;font-size:13px;line-height:1.6;color:${t.mutedForeground};">${escapeHtml(replyNote)}</p>` : ""}`;

  return {
    from: address(fromName, from),
    to: address(safeName(app.name), app.email.trim()),
    replyTo: address(contact.name, contact.email),
    subject,
    text,
    html: layout({
      t,
      site,
      preheader: subject,
      // The subject usually names the position already, so show its type instead.
      eyebrow: listing.type || listing.title || "",
      heading: subject,
      content,
    }),
  };
}
