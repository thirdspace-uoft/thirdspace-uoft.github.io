import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccount = keyPath && keyPath.endsWith(".json")
  ? JSON.parse(readFileSync(join(process.cwd(), keyPath), "utf-8"))
  : JSON.parse(keyPath);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const snap = await db.collection("config").doc("site").get();
if (!snap.exists) {
  console.error("Firestore document config/site not found!");
  process.exit(1);
}

const content = snap.data();
const outPath = join(process.cwd(), "public", "config", "content.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(content, null, 2), "utf-8");
console.log("content.json regenerated from Firestore");
