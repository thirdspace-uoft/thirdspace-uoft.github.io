/**
 * Seeds the copy for the /contact page in Firestore `config/site`: the
 * `contact` section and the `hiring` section (open positions) shown on it.
 *
 *   node --env-file=.env scripts/seed-contact.mjs           report only (default)
 *   node --env-file=.env scripts/seed-contact.mjs --apply   write what is missing
 *
 * Only fields that are missing or empty are written, so anything already edited
 * in /admin wins and re-running is safe. Lists (`hiring.process`,
 * `hiring.listings`) are written only when absent. No job listings are seeded:
 * those are added in /admin → Hiring. The address, email and X handle are not
 * part of `contact`: the page reads `location` and `socials`, like the footer.
 *
 * The write is a transaction scoped to these two sections: /admin overwrites the
 * whole document, so a plain read-modify-write could discard a publish made in
 * between.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

export const DEFAULTS = {
  contact: {
    enabled: true,
    navLabel: "Contact",
    page: {
      title: "Contact",
      intro: [
        "We study how computing can work for people at the margins — through human-computer interaction, responsible AI, and critical computing. Whether you are a prospective student, a researcher hoping to collaborate, a community or policy partner, or a journalist covering technology and society, we would love to hear from you.",
        "Email is the quickest way to reach us. To get a feel for our work first, browse our [research](/research) and [publications](/publications).",
      ].join("\n\n"),
      metaTitle: "Contact — ThirdSpace",
      metaDescription:
        "Get in touch with the ThirdSpace research group at the University of Toronto: email, X, how to find us at the Bahen Centre, and open positions.",
    },
    labels: {
      connectHeading: "Connect",
      openMapLabel: "Open in Google Maps",
    },
  },
  hiring: {
    enabled: true,
    heading: "Join us",
    intro:
      "ThirdSpace works with students and researchers who want to build technology with — and for — communities that are usually left out of its design. Each open position names its mentor and how the work happens: online, in person at the Bahen Centre, or a mix of both.",
    emptyLabel:
      "There are no open positions right now. If you would like to work with us, email a short note about your interests with a link to your CV — we read every message when the next round opens.",
    defaultContactName: "ThirdSpace",
    defaultContactEmail: "thirdspace.uoft.cs@gmail.com",
    process: [
      {
        title: "Apply",
        body: "Send the form for a position with a link to your CV or portfolio and a few sentences on why the work interests you.",
      },
      {
        title: "Short assignment",
        body: "For some positions a small task arrives by email right after you apply. It mirrors the real work and should take hours, not days.",
      },
      {
        title: "Conversation",
        body: "If it looks like a fit, you meet your mentor to talk through the task, your interests, and how you like to work.",
      },
      {
        title: "Decision",
        body: "We let you know where things stand once the review for the position is done.",
      },
    ],
    labels: {
      modes: { online: "Online", offline: "In person", hybrid: "Hybrid" },
      mentor: "Mentor",
      commitment: "Commitment",
      deadline: "Apply by",
      contact: "Questions?",
      positionsHeading: "Open positions",
      processHeading: "How we hire",
      viewDetails: "Details & apply",
      apply: "Apply for this position",
      closed: "Applications for this position have closed.",
      close: "Close",
      form: {
        name: "Full name",
        email: "Email",
        cvUrl: "Link to your CV or portfolio",
        cvHint: "Google Drive, Dropbox, a personal site or LinkedIn — make sure the link is viewable by anyone.",
        message: "Why this position?",
        messageHint: "A few sentences on your interests and relevant experience.",
        submit: "Submit application",
        submitting: "Sending…",
        success:
          "Thank you — your application is in. It goes straight to the contact person for this position, and if the position has an assignment, it will reach your inbox shortly.",
        error: "Something went wrong and your application was not sent. Please try again, or email us directly.",
        invalid: "Please check the highlighted fields.",
        privacyNote: "Your details are shared only with the people reviewing this position.",
      },
      email: {
        assignmentLink: "Open the assignment",
        replyNote: "Questions? Reply to this email and it goes straight to {contact}.",
      },
    },
    listings: [],
  },
};

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

const isMissing = (value) => value === undefined || value === null || value === "";
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Dotted field paths for every default the live document lacks. Objects recurse; lists and values are leaves. */
function missingFields(defaults, current, prefix = "") {
  const update = {};
  for (const [key, value] of Object.entries(defaults)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const existing = current?.[key];
    if (isPlainObject(value) && (isPlainObject(existing) || existing === undefined)) {
      if (existing === undefined) update[path] = value;
      else Object.assign(update, missingFields(value, existing, path));
    } else if (isMissing(existing)) {
      update[path] = value;
    }
  }
  return update;
}

async function main() {
  const db = initDb();
  const ref = db.collection("config").doc("site");

  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error("Firestore document config/site does not exist");
  const planned = missingFields(DEFAULTS, snapshot.data());

  if (Object.keys(planned).length === 0) {
    console.log("contact and hiring are already complete; nothing to write.");
    return;
  }
  console.log(`${APPLY ? "Writing" : "Would write"} ${Object.keys(planned).length} field(s):`);
  for (const [path, value] of Object.entries(planned)) {
    const shown = JSON.stringify(value);
    console.log(`  ${path} = ${shown.length > 160 ? `${shown.slice(0, 157)}…` : shown}`);
  }
  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  await db.runTransaction(async (tx) => {
    const fresh = (await tx.get(ref)).data();
    const update = missingFields(DEFAULTS, fresh);
    if (Object.keys(update).length === 0) return;
    tx.update(ref, { ...update, lastModified: new Date().toISOString() });
  });
  console.log("Done. Run `npm run fetch-content` to pull it into public/config/content.json.");
}

// Run only when executed directly, so the defaults can be imported elsewhere.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
