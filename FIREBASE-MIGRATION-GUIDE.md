# Firebase + ImageKit Migration Guide — Thirdspace

Migrate from `content.json` + GitHub-based CMS to **Firebase Firestore** (structured data) and **ImageKit** (images).

---

## Architecture

```
Before:                         After:
content.json (in repo)          Firestore (collection: config / doc: site)
  ↑ write (GitHub API)             ↑ write (Firebase SDK — admin page)
  ↓ read (static ES import)        ↓ read (prebuild script → JSON file)
GitHub Pages deploy                GitHub Pages deploy (still static)
Images in public/                  ImageKit (CDN-delivered, transformations)
```

The site remains a **Next.js static export** (`output: "export"`). A prebuild script fetches from Firestore and generates `content.json` before each build, so existing static imports keep working.

---

## ✅ Completed Steps

### Step 1 — Firebase Project Created

Project **`thirdspace-uoft`** created. Firestore initialized in `nam5`.

### Step 2 — Firebase CLI Initialized

```bash
firebase init firestore
```

Created:
- `firestore.rules`
- `firestore.indexes.json`

`firebase init storage` skipped — using **ImageKit** instead (free tier).

### Step 3 — Dependencies Installed

```bash
npm install firebase firebase-admin
npm install @imagekit/next
```

### Step 4 — Firebase Config in `.env`

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAJt7TNw6WDbIm_l3bYtR9oVFwLAMldlKQ` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `thirdspace-uoft.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `thirdspace-uoft` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `thirdspace-uoft.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `993030008909` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:993030008909:web:c97e82d93a635ffdfe6c04` |

### Step 5 — Service Account Key

File `thirdspace-uoft-firebase-adminsdk-fbsvc-d10559b9db.json` downloaded.
`.env` references it via:

```env
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=thirdspace-uoft-firebase-adminsdk-fbsvc-d10559b9db.json
```

Both `scripts/fetch-content.mjs` and `scripts/migrate-to-firebase.mjs` read this file automatically. Scripts run with `--env-file=.env` (Node 22 native flag, no dotenv needed).

### Step 6 — Files Created

| File | Status |
|------|--------|
| `src/lib/firebase.ts` | ✅ Firebase client config |
| `scripts/migrate-to-firebase.mjs` | ✅ One-time migration script |
| `scripts/fetch-content.mjs` | ✅ Prebuild script |
| `package.json` | ✅ Updated with `--env-file=.env` |
| `.env` | ✅ Firebase + ImageKit stubs filled |

### Step 7 — Firestore Data Model

```
Collection: "config"
  └── Document: "site"
        ├── layout: { pageTitle, pageDescription, ... }
        ├── navbar: { brandName, links: [...], ... }
        ├── hero: { badge, groupPhotoPath: "/group-photos/group_photo_crp.PNG", ... }
        ├── home: { ... }
        ├── marquee: { keywords: [...] }
        ├── groupOverview: { ... }
        ├── professor: { name, imagePath: "/headshots/ishtique-ahmed.png", ... }
        ├── researchDomains: { items: [...] }
        ├── about: { ... }
        ├── latestPublications: { ... }
        ├── homePillars: { ... }
        ├── team: { sections: [...], alumni: {...}, ... }
        ├── pillars: [...]
        ├── researchLabs: { items: [...] }
        ├── campuses: { items: [...] }
        ├── location: { ... }
        ├── socials: { ... }
        ├── brand: { ... }
        ├── publications: { books: [], years: {...} }
        └── contact: { ... }
```

Image paths stored as root-relative (e.g. `/headshots/ishtique-ahmed.png`). ImageKit resolves them at render time via `urlEndpoint + src`.

---

## 🔧 Still To Do

### Step 8 — ImageKit Keys ✅

All keys configured in `.env`:

```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/6lrshzbq1
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_ceZcPfhgVnUzLdYrWwlIHNbe0eI=
NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY=private_2SzHE4jnHyc1KhJUQ6dZykIKxh4=
```

### Step 8 — Firebase Auth Enabled ✅

Firebase Authentication (Email/Password) was enabled manually via the Firebase Console at `https://console.firebase.google.com/project/thirdspace-uoft/authentication`. The project was upgraded to the **Blaze (pay-as-you-go)** plan — email/password auth stays within the free tier.

The admin user was created by running:

```bash
node --env-file=.env scripts/create-admin-user.mjs
```

This script uses the Firebase Admin SDK to create or update the admin user in Firebase Auth. Once the user was confirmed working (`signInWithEmailAndPassword` returns a valid ID token), the temporary env vars were removed from `.env`.

### Step 9 — Admin Auth Integration in Code ✅

Admin login no longer uses hardcoded `.env` credentials + custom JWT (`jose`). Instead:

- **`signInWithEmailAndPassword`** handles authentication in the admin page.
- **`onAuthStateChanged`** manages session lifecycle (no manual expiry timers).
- **`signOut`** (Firebase) replaces the old `clearSession()` / `clearExpiryTimer()` cleanup.
- A helper script `scripts/create-admin-user.mjs` creates/updates admin users via the Admin SDK.

**Files deleted** (replaced by Firebase Auth SDK):
- `src/lib/admin-credentials.ts`
- `src/lib/admin-session.ts`

**Env vars removed** from `.env`:
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_ADMIN_PASSWORD`
- `NEXT_PUBLIC_ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_ADMIN_SESSION_TTL_HOURS`

**Credentials note:** `ADMIN_USER_EMAIL` and `ADMIN_USER_PASSWORD` are not stored in `.env`. The admin user is managed entirely in Firebase Auth. To recreate or update the admin user, pass the vars inline:
```bash
ADMIN_USER_EMAIL=user@example.com ADMIN_USER_PASSWORD=secret node --env-file=.env scripts/create-admin-user.mjs
```

### Step 10 — Upload Images to ImageKit ✅

Images were uploaded programmatically via the ImageKit Upload API, preserving the folder structure:
- `headshots/ishtique-ahmed.png`
- `headshots/ramaravind-scaled.jpg`
- `group-photos/group_photo_crp.PNG`

The URL endpoint in `.env` was corrected from `zbq1` to `zb1q`. The `getImageUrl()` function in `src/lib/utils.ts` now reads from `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` instead of a hardcoded value.

**Note:** `src/app/api/imagekit-auth/route.ts` was not created because the site uses `output: "export"` (static export), which does not support API routes. If admin-side image upload is needed later, use ImageKit's client-side `upload()` with unsigned upload (no auth params needed for basic uploads).

### Step 11 — Run One-Time Migration ✅

The migration script was run during setup:
```bash
npm run migrate:firebase
```

The prebuild script `scripts/fetch-content.mjs` now reads from Firestore and regenerates `public/config/content.json` on every build. You can verify by running `npm run build` — it prints "content.json regenerated from Firestore".

### Step 12 — Admin Page Updated to Firebase (Firestore + Auth) ✅

The admin page (`src/app/admin/page.tsx`) has been fully migrated:

- Loads content from Firestore via `getDoc(doc(db, "config", "site"))`.
- Publishes changes to Firestore via `setDoc(doc(db, "config", "site"), content)`.
- Login uses Firebase Auth (`signInWithEmailAndPassword`) instead of `.env` credentials.
- Session managed by `onAuthStateChanged` — no manual JWT or expiry handling.
- Sign-out calls `firebaseSignOut(auth)`.
- Old auth modules (`admin-credentials.ts`, `admin-session.ts`) deleted.

### Step 13 — Replace `getAssetPath()` with ImageKit in Components ✅

All content-driven components (pages, team member cards, hero section) already use `getImageUrl()` from `@/lib/utils` instead of `getAssetPath()`. The function constructs ImageKit URLs from content paths:

```tsx
// src/lib/utils.ts
export function getImageUrl(path: string): string {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/6lrshzb1q";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${endpoint}${normalizedPath}`;
}
```

The only remaining `getAssetPath()` usage is in `brand-mark.tsx` for the UofT logo (`/uoft-logo.svg`) — a local SVG that should stay local, not served via ImageKit.

### Step 14 — Firestore Security Rules ✅

Deployed:
```bash
firebase deploy --only firestore
```

Rules in `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/site {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Only authenticated Firebase Auth users can write to the config.

### Step 15 — Local Dev & Build ✅

Both commands work and have been verified:
```bash
npm run dev        # Starts Next.js dev server
npm run build      # Fetches from Firestore → exports static site
```

### Step 17 — CI/CD (GitHub Actions)

Add these repo secrets:
- `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` — (not needed in CI, use direct key instead)
- Or better: add the full key as `FIREBASE_SERVICE_ACCOUNT_KEY` secret (inline JSON)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY`

The build scripts handle both env var and file-path auth methods automatically.

---

## Summary

| File / Concern | Status | Notes |
|----------------|--------|-------|
| `.env` | ✅ Clean | Endpoint corrected to `zb1q`; old auth vars removed |
| `Firebase Auth (Email/Password)` | ✅ Enabled | Via Firebase Console + Blaze plan |
| `scripts/create-admin-user.mjs` | ✅ Created & run | Admin user created in Firebase Auth |
| `src/app/admin/page.tsx` | ✅ Done | Auth + Firestore load/publish |
| `src/lib/admin-credentials.ts` | ✅ Deleted | Replaced by Firebase Auth |
| `src/lib/admin-session.ts` | ✅ Deleted | Replaced by Firebase Auth SDK |
| `src/lib/firebase.ts` | ✅ Done | Exports `auth` + `db` |
| `src/lib/utils.ts` | ✅ Done | `getImageUrl()` reads from env; `getAssetPath()` kept for local SVGs |
| `scripts/migrate-to-firebase.mjs` | ✅ Done & run | Data written to Firestore |
| `scripts/fetch-content.mjs` | ✅ Done | Runs on every `npm run build` |
| `package.json` | ✅ Done | `--env-file=.env` configured |
| Images on ImageKit | ✅ Uploaded | headshots + group photo; accessible via `getImageUrl()` |
| `firebase deploy --only firestore` | ✅ Deployed | Rules enforce `request.auth != null` for writes |
| `src/app/api/imagekit-auth/route.ts` | ❌ Skipped | Not compatible with `output: "export"`; use unsigned client upload if needed later |

---

## Troubleshooting

### "Cannot find module 'firebase-admin/app'"
Make sure Node.js 18+ is installed. Current: v22.19.0 ✓

### Scripts can't find `.env`
Both scripts use `node --env-file=.env` in `package.json`. Make sure you run via `npm run build` or `npm run migrate:firebase`.

### Images not loading
Ensure ImageKit URL endpoint and public key are correct. Images must be uploaded to ImageKit.

### Prebuild fails in CI
The script falls back to `process.env.FIREBASE_SERVICE_ACCOUNT_KEY` if `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` is not set. In CI, pass the full JSON inline as a secret.
