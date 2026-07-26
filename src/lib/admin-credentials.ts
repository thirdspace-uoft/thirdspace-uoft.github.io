// Admin credentials and session helpers for the static-gated /admin page.
//
// .env (local)  -> use these directly
// CI (GH Pages) -> workflow writes .env.production from repo secrets
//
// All values live in the public JS bundle; the session secret only stops
// a user from forging their own session token. Anyone with the source can
// log in as admin — this is a static-gated demo, not real security.

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
export const ADMIN_SESSION_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_SESSION_SECRET ?? "";
export const ADMIN_SESSION_TTL_HOURS = Number(
  process.env.NEXT_PUBLIC_ADMIN_SESSION_TTL_HOURS ?? "8"
);

export const SESSION_STORAGE_KEY = "thirdspace_admin_session";
export const SESSION_ISSUER = "thirdspace-admin";
