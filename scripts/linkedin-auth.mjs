// One-time (then yearly) LinkedIn authorisation for automatic sharing.
//
//   npm run linkedin-auth
//
// Run it on your own computer, signed in to LinkedIn as an admin of the lab's
// LinkedIn Page. It opens LinkedIn's consent screen, catches the redirect on
// http://localhost:8723/callback, and stores the tokens in Firestore at
// private/linkedin, where only the share workflow (Admin SDK) can read them.
//
// Needs in .env: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ORG_ID
// and the Firebase service account. In the LinkedIn developer app, add
// http://localhost:8723/callback as an authorised redirect URL.

import { createServer } from "http";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { exchangeCode, linkedinConfig, tokenRecord } from "./lib/linkedin.mjs";

const PORT = 8723;
const REDIRECT = `http://localhost:${PORT}/callback`;

const config = linkedinConfig();
if (!config) {
  console.error("Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET and LINKEDIN_ORG_ID in .env first.");
  process.exit(1);
}

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!key) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_PATH in .env first.");
  process.exit(1);
}
const serviceAccount = key.endsWith(".json") ? JSON.parse(readFileSync(join(process.cwd(), key), "utf-8")) : JSON.parse(key);
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const state = randomBytes(16).toString("hex");
const authUrl =
  "https://www.linkedin.com/oauth/v2/authorization?" +
  new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: REDIRECT,
    state,
    scope: "w_organization_social",
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end();
    return;
  }
  const finish = (status, message) => {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" }).end(message);
    console.log(message);
    server.close();
    process.exitCode = status === 200 ? 0 : 1;
  };
  if (url.searchParams.get("state") !== state) return finish(400, "State mismatch; start again.");
  if (url.searchParams.get("error")) return finish(400, `LinkedIn said: ${url.searchParams.get("error_description")}`);
  try {
    const json = await exchangeCode(config, url.searchParams.get("code"), REDIRECT);
    const record = tokenRecord(json);
    await db.doc("private/linkedin").set(record);
    await db.doc("config/site").update({
      "socialStatus.linkedin": { ok: true, message: "", checkedAt: new Date().toISOString() },
    });
    const until = record.refreshTokenExpiresAt?.slice(0, 10) ?? record.accessTokenExpiresAt.slice(0, 10);
    finish(200, `LinkedIn connected. Tokens saved to Firestore. Run this again before ${until}. You can close this tab.`);
  } catch (err) {
    finish(500, err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Opening LinkedIn. If nothing opens, visit:\n${authUrl}\n`);
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} "${authUrl}"`);
});
