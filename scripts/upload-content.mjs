import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

const content = JSON.parse(
  readFileSync(join(process.cwd(), "public", "config", "content.json"), "utf-8")
);

const keyPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

const serviceAccount = keyPath && keyPath.endsWith(".json")
  ? JSON.parse(readFileSync(join(process.cwd(), keyPath), "utf-8"))
  : JSON.parse(keyPath);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

await db.collection("config").doc("site").set({
  ...content,
  lastModified: new Date().toISOString(),
});

console.log("content.json uploaded to Firestore");
