import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assignmentEmail,
  fillTemplate,
  findListing,
  notificationEmail,
  pickContact,
  skipReason,
} from "./applications-mail.mjs";
import { DEFAULT_THEME } from "./email-theme.mjs";

const hiring = {
  defaultContactName: "ThirdSpace",
  defaultContactEmail: "thirdspace.uoft.cs@gmail.com",
  listings: [
    {
      id: "ra-1",
      slug: "research-assistant",
      title: "Research Assistant",
      assignment: {
        autoSend: true,
        subject: "Your {position} task",
        body: "Hi {name},\n\nPlease complete the task below.",
        url: "https://example.com/task",
      },
    },
    { id: "pd-1", slug: "postdoc", title: "Postdoc", contactName: "Prof. A", contactEmail: "a@example.com" },
  ],
};

const app = {
  listingId: "ra-1",
  name: "Sam Lee",
  email: "sam@example.com",
  cvUrl: "https://example.com/cv.pdf",
  message: "I would like to join.",
};

test("pickContact falls back to the section default", () => {
  assert.deepEqual(pickContact(hiring.listings[0], hiring), {
    name: "ThirdSpace",
    email: "thirdspace.uoft.cs@gmail.com",
  });
  assert.deepEqual(pickContact(hiring.listings[1], hiring), { name: "Prof. A", email: "a@example.com" });
});

test("findListing matches by id, then by slug", () => {
  assert.equal(findListing(app, hiring)?.title, "Research Assistant");
  assert.equal(findListing({ listingId: "postdoc" }, hiring)?.title, "Postdoc");
  assert.equal(findListing({ listingId: "gone" }, hiring), undefined);
});

test("skipReason accepts a valid application and names what is wrong otherwise", () => {
  const listing = hiring.listings[0];
  assert.equal(skipReason(app, listing, hiring), null);
  assert.equal(skipReason(app, undefined, hiring), "listing not found");
  assert.equal(skipReason(app, { ...listing, open: false }, hiring), "listing closed");
  assert.equal(skipReason({ ...app, email: "nope" }, listing, hiring), "invalid email");
  assert.equal(skipReason({ ...app, cvUrl: "javascript:alert(1)" }, listing, hiring), "invalid CV link");
  assert.equal(skipReason({ ...app, message: "  " }, listing, hiring), "invalid message");
  assert.equal(
    skipReason(app, listing, { ...hiring, defaultContactEmail: "" }),
    "listing has no valid contact email",
  );
});

test("notificationEmail goes to the contact with reply-to the applicant", () => {
  const mail = notificationEmail({
    app,
    listing: hiring.listings[1],
    hiring,
    from: "thirdspace.uoft.cs@gmail.com",
    fromName: "ThirdSpace",
  });
  assert.equal(mail.to, '"Prof. A" <a@example.com>');
  assert.equal(mail.replyTo, '"Sam Lee" <sam@example.com>');
  assert.equal(mail.from, '"ThirdSpace" <thirdspace.uoft.cs@gmail.com>');
  assert.match(mail.subject, /Postdoc — Sam Lee/);
  assert.match(mail.text, /https:\/\/example\.com\/cv\.pdf/);
});

test("subjects cannot carry injected header lines", () => {
  const mail = notificationEmail({
    app: { ...app, name: "Eve\r\nBcc: x@example.com" },
    listing: hiring.listings[0],
    hiring,
    from: "f@example.com",
  });
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.doesNotMatch(mail.replyTo, /[\r\n]/);
});

test("html escapes applicant text", () => {
  const mail = notificationEmail({
    app: { ...app, message: "<script>alert(1)</script>" },
    listing: hiring.listings[0],
    hiring,
    from: "f@example.com",
  });
  assert.doesNotMatch(mail.html, /<script>/);
  assert.match(mail.html, /&lt;script&gt;/);
});

test("assignmentEmail fills placeholders and replies to the contact", () => {
  const mail = assignmentEmail({ app, listing: hiring.listings[0], hiring, from: "f@example.com" });
  assert.equal(mail.to, '"Sam Lee" <sam@example.com>');
  assert.equal(mail.replyTo, '"ThirdSpace" <thirdspace.uoft.cs@gmail.com>');
  assert.equal(mail.subject, "Your Research Assistant task");
  assert.match(mail.text, /^Hi Sam Lee,/);
  assert.match(mail.text, /https:\/\/example\.com\/task/);
  assert.match(mail.text, /Reply to this email and it goes straight to ThirdSpace\.$/);
  // The assignment link is the call-to-action button.
  assert.match(mail.html, /<a href="https:\/\/example\.com\/task"[^>]*>Open the assignment<\/a>/);
});

test("emails use the site branding and theme", () => {
  const site = {
    brand: { name: "ThirdSpace", tagline: "Research Group" },
    location: { institution: "Bahen Centre", street: "40 St. George Street", cityCountry: "Toronto" },
    siteUrl: "https://lab.example",
  };
  const theme = { ...DEFAULT_THEME, primary: "#123456" };
  const mail = notificationEmail({ app, listing: hiring.listings[0], hiring, from: "f@example.com", site, theme });
  assert.match(mail.html, /ThirdSpace · Research Group/);
  assert.match(mail.html, /Bahen Centre, 40 St\. George Street/);
  assert.match(mail.html, /src="https:\/\/lab\.example\/long_logo\.webp"/);
  assert.match(mail.html, /background:#123456/);
  assert.match(mail.html, /href="mailto:sam@example\.com\?subject=Re%3A%20Research%20Assistant"/);
});

test("an inline (cid:) logo replaces the hosted one", async () => {
  const { INLINE_LOGO, logoAttachment } = await import("./applications-mail.mjs");
  const mail = notificationEmail({ app, listing: hiring.listings[0], hiring, from: "f@example.com", site: { logo: INLINE_LOGO } });
  assert.match(mail.html, /<img src="cid:thirdspace-logo" width="140"/);
  assert.doesNotMatch(mail.html, /long_logo\.webp/);
  const att = logoAttachment(Buffer.from([1, 2, 3]));
  assert.deepEqual(att, { content: "AQID", filename: "thirdspace-logo.png", contentId: "thirdspace-logo" });
});

test("assignment email copy comes from hiring.labels.email when set", () => {
  const custom = { ...hiring, labels: { email: { assignmentLink: "Start the task", replyNote: "Ask {contact}." } } };
  const mail = assignmentEmail({ app, listing: hiring.listings[0], hiring: custom, from: "f@example.com" });
  assert.match(mail.html, />Start the task<\/a>/);
  assert.match(mail.text, /Ask ThirdSpace\.$/);
});

test("a non-http assignment link is not turned into a button", () => {
  const listing = { ...hiring.listings[0], assignment: { ...hiring.listings[0].assignment, url: "javascript:alert(1)" } };
  const mail = assignmentEmail({ app, listing, hiring, from: "f@example.com" });
  assert.doesNotMatch(mail.html, /javascript:/);
});

test("assignmentEmail is null unless auto-send is on and there is something to send", () => {
  assert.equal(assignmentEmail({ app, listing: hiring.listings[1], hiring, from: "f" }), null);
  const off = { ...hiring.listings[0], assignment: { ...hiring.listings[0].assignment, autoSend: false } };
  assert.equal(assignmentEmail({ app, listing: off, hiring, from: "f" }), null);
  const empty = { ...hiring.listings[0], assignment: { autoSend: true, subject: "x", body: "", url: "" } };
  assert.equal(assignmentEmail({ app, listing: empty, hiring, from: "f" }), null);
});

test("applicant names cannot carry links into mail sent to unverified addresses", () => {
  const evil = { ...app, name: "Win a prize at https://phish.example/x?a=1 <b>now</b>" };
  const mail = assignmentEmail({ app: evil, listing: hiring.listings[0], hiring, from: "f@example.com" });
  // Letters may survive as plain words, but nothing link-shaped or markup does.
  const greeting = mail.text.split("\n")[0];
  assert.doesNotMatch(greeting, /https?:|\/|[?=<>]/);
  // No link in the email points anywhere the applicant chose.
  assert.doesNotMatch(mail.html, /href="[^"]*phish/);
  assert.doesNotMatch(mail.html, /<b>/);
  assert.doesNotMatch(mail.to, /https?:|[<>]{2}/);
  assert.ok(mail.text.startsWith("Hi Win a prize at"));
});

test("safeName keeps accented names and caps the length", async () => {
  const { safeName } = await import("./applications-mail.mjs");
  assert.equal(safeName("  Émilie  O'Brien-Núñez "), "Émilie O'Brien-Núñez");
  assert.equal(safeName("x".repeat(100)).length, 60);
});

test("fillTemplate leaves unknown braces alone", () => {
  assert.equal(fillTemplate("{name} / {other}", app, hiring.listings[0]), "Sam Lee / {other}");
});
