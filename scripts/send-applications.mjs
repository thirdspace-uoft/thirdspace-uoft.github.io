/**
 * Delivers job applications submitted from the hiring section on /contact.
 *
 *   node --env-file=.env scripts/send-applications.mjs             send
 *   node --env-file=.env scripts/send-applications.mjs --dry-run   print, send nothing, change nothing
 *
 * For each application in Firestore `applications` with status "new" (or
 * "failed" with attempts left), it emails the listing's contact person (reply-to
 * = the applicant) and, when the listing's assignment has auto-send on, emails
 * the assignment to the applicant (reply-to = the contact). Runs every few
 * minutes from .github/workflows/send-applications.yml.
 *
 * Each application is claimed in a transaction ("new" → "sending") before any
 * email goes out, so an overlapping run can't send it twice. A partly sent
 * application remembers which email already went (`notifiedAt`) and a retry
 * sends only the rest.
 *
 * Mail goes out through Resend (https://resend.com/docs/send-with-nodejs).
 *
 * Env: FIREBASE_SERVICE_ACCOUNT_KEY (JSON or path), RESEND_API_KEY, and
 * MAIL_FROM: the sender address, on a domain verified at resend.com/domains.
 * `onboarding@resend.dev` works only for testing, and then Resend delivers
 * only to the Resend account's own email address.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

import { emailTheme } from "./lib/email-theme.mjs";
import {
  DEFAULT_SITE_URL,
  INLINE_LOGO,
  logoAttachment,
  assignmentEmail,
  findListing,
  normalizeEmail,
  notificationEmail,
  skipReason,
} from "./lib/applications-mail.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
/** Applications handled per run; the rest wait for the next one. Resend's free plan allows 100 emails/day. */
const BATCH = 25;
const MAX_ATTEMPTS = 3;

function initDb() {
  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set (run with --env-file=.env)");
  const serviceAccount = keyPath.endsWith(".json")
    ? JSON.parse(readFileSync(join(process.cwd(), keyPath), "utf-8"))
    : JSON.parse(keyPath);
  if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** MAIL_FROM as a bare address; the display name comes from the hiring settings. */
function senderAddress() {
  const from = process.env.MAIL_FROM?.trim() ?? "";
  if (!EMAIL.test(from)) {
    throw new Error("MAIL_FROM must be a plain email address on a domain verified in Resend, e.g. hiring@example.org");
  }
  return from;
}

function createMailer() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY must be set to send email");
  const resend = new Resend(key);
  return {
    from: senderAddress(),
    /** Resend returns { data, error } instead of throwing; turn errors into throws for the retry logic. */
    async send(mail) {
      const { data, error } = await resend.emails.send(mail);
      if (error) throw new Error(`${error.name ?? "resend_error"}: ${error.message}`);
      return data?.id;
    },
  };
}

/** The site's design tokens; the emails fall back to built-in colours if this is missing. */
function readCss() {
  try {
    return readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");
  } catch {
    return "";
  }
}

/** scripts/assets/email-logo.png, or null (the emails then use the hosted WebP). */
function readLogo() {
  try {
    return readFileSync(join(process.cwd(), "scripts/assets/email-logo.png"));
  } catch {
    return null;
  }
}

const toIso = (ts) => (ts?.toDate ? ts.toDate().toISOString() : undefined);

/**
 * The repository is public, so GitHub Actions logs are too: a real run logs
 * only document and listing ids, never names or addresses. Error text from the
 * mail API can quote an address, so it is masked as well. `--dry-run` (local
 * use) still prints everything.
 */
const maskEmails = (text) =>
  String(text).replace(/([^\s@<>"'(),;:]{1,2})[^\s@<>"'(),;:]*@([^\s@<>"'(),;:]+)/g, "$1***@$2");

function printMail(label, mail) {
  console.log(`  ── ${label}`);
  console.log(`     to: ${mail.to}\n     reply-to: ${mail.replyTo}\n     subject: ${mail.subject}`);
  console.log(mail.text.replace(/^/gm, "     | "));
}

async function main() {
  const db = initDb();
  const site = (await db.collection("config").doc("site").get()).data() ?? {};
  const hiring = site.hiring ?? {};
  const fromName = hiring.defaultContactName || site.brand?.name || "";
  // Branding for the HTML emails: the site's tokens, brand line and address.
  const emailSite = {
    brand: site.brand,
    location: site.location,
    siteUrl: process.env.SITE_URL?.trim() || DEFAULT_SITE_URL,
  };
  const theme = emailTheme(readCss());
  // Inline logo (cid:) so mail clients never re-encode it; see LOGO_CONTENT_ID.
  const logoBytes = readLogo();
  if (logoBytes) emailSite.logo = INLINE_LOGO;
  const withLogo = (mail) => (logoBytes ? { ...mail, attachments: [logoAttachment(logoBytes)] } : mail);

  const snapshot = await db
    .collection("applications")
    .where("status", "in", ["new", "failed"])
    .limit(BATCH * 2)
    .get();
  const pending = snapshot.docs
    .filter((d) => (d.data().attempts ?? 0) < MAX_ATTEMPTS)
    .slice(0, BATCH);

  if (pending.length === 0) {
    console.log("No applications to send.");
    return;
  }
  console.log(`${pending.length} application(s) to ${DRY_RUN ? "preview" : "send"}.`);

  const mailer = DRY_RUN ? { from: process.env.MAIL_FROM?.trim() || "(MAIL_FROM)" } : createMailer();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of pending) {
    const ref = docSnap.ref;
    const app = docSnap.data();
    const listing = findListing(app, hiring);
    const reason = skipReason(app, listing, hiring);
    console.log(
      DRY_RUN
        ? `\n• ${ref.id} — ${app.listingTitle || app.listingId} — ${app.name} <${app.email}>`
        : `\n• ${ref.id} — listing ${app.listingId}`,
    );

    // A repeat from the same address for the same position is not mailed again.
    // Without this the form could make the lab's account email the assignment
    // to one (unverified) address over and over.
    const emailKey = normalizeEmail(app.email);
    const repeat =
      !reason &&
      !app.notifiedAt &&
      !(await db
        .collection("applications")
        .where("emailKey", "==", emailKey)
        .where("listingId", "==", app.listingId)
        .where("status", "==", "sent")
        .limit(1)
        .get()).empty;
    const finalReason = reason ?? (repeat ? "repeat application from the same email" : null);

    if (finalReason) {
      console.log(`  skipped: ${finalReason}`);
      skipped++;
      if (!DRY_RUN) {
        await ref.update({ status: "skipped", skipReason: finalReason, emailKey, updatedAt: FieldValue.serverTimestamp() });
      }
      continue;
    }

    const input = {
      app,
      listing,
      hiring,
      from: mailer.from,
      fromName,
      submittedAt: toIso(app.createdAt),
      site: emailSite,
      theme,
    };
    const notification = notificationEmail(input);
    const assignment = assignmentEmail(input);

    if (DRY_RUN) {
      if (!app.notifiedAt) printMail("to contact", notification);
      if (assignment && !app.assignmentSentAt) printMail("assignment to applicant", assignment);
      continue;
    }

    // Claim it, so an overlapping run leaves it alone.
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      const status = fresh.data()?.status;
      if (status !== "new" && status !== "failed") return false;
      tx.update(ref, { status: "sending", emailKey, updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) {
      console.log("  already taken by another run");
      continue;
    }

    try {
      if (!app.notifiedAt) {
        await mailer.send(withLogo(notification));
        await ref.update({ notifiedAt: FieldValue.serverTimestamp(), notifiedTo: notification.to });
        console.log("  contact notified");
      }
      if (assignment && !app.assignmentSentAt) {
        await mailer.send(withLogo(assignment));
        await ref.update({ assignmentSentAt: FieldValue.serverTimestamp() });
        console.log("  assignment sent to applicant");
      }
      await ref.update({
        status: "sent",
        attempts: FieldValue.increment(1),
        error: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      sent++;
    } catch (err) {
      failed++;
      const message = String(err?.message ?? err).slice(0, 500);
      // Full text goes to the (private) Firestore document; the public log gets it masked.
      console.error(`  failed: ${maskEmails(message)}`);
      await ref.update({
        status: "failed",
        error: message,
        attempts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  console.log(
    DRY_RUN
      ? "\nDry run: nothing was sent or changed."
      : `\nSent ${sent}, skipped ${skipped}, failed ${failed}.`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
