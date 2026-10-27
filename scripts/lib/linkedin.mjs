// Posting to the lab's LinkedIn Page through the Posts API.
//
// Tokens live in Firestore at private/linkedin (Admin SDK only; the rules
// deny every client), not in GitHub secrets, because access tokens last 60
// days and this code has to save the refreshed ones. scripts/linkedin-auth.mjs
// stores the first set.
//
// LinkedIn versions its API monthly and retires each version after about a
// year. LINKEDIN_API_VERSION overrides the default below; bump it when the
// docs' deprecation notice reaches it.

const DEFAULT_VERSION = "202610";
const DAY = 24 * 60 * 60 * 1000;

export function linkedinConfig(env = process.env) {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ORG_ID } = env;
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_ORG_ID) return null;
  return {
    clientId: LINKEDIN_CLIENT_ID,
    clientSecret: LINKEDIN_CLIENT_SECRET,
    orgUrn: `urn:li:organization:${LINKEDIN_ORG_ID}`,
    version: env.LINKEDIN_API_VERSION || DEFAULT_VERSION,
  };
}

/** The token response → what is stored in private/linkedin. */
export function tokenRecord(json, now = Date.now(), previous = {}) {
  return {
    accessToken: json.access_token,
    accessTokenExpiresAt: new Date(now + json.expires_in * 1000).toISOString(),
    refreshToken: json.refresh_token ?? previous.refreshToken ?? null,
    refreshTokenExpiresAt: json.refresh_token_expires_in
      ? new Date(now + json.refresh_token_expires_in * 1000).toISOString()
      : previous.refreshTokenExpiresAt ?? null,
    updatedAt: new Date(now).toISOString(),
  };
}

async function tokenRequest(config, params) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, client_id: config.clientId, client_secret: config.clientSecret }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`LinkedIn token request failed (${res.status}): ${json.error_description ?? json.error ?? "unknown"}`);
  return json;
}

export function exchangeCode(config, code, redirectUri) {
  return tokenRequest(config, { grant_type: "authorization_code", code, redirect_uri: redirectUri });
}

/**
 * A usable access token, refreshing it when it has under 7 days left.
 * Returns `{ token, warning }`; `warning` is set when the refresh token itself
 * is close to expiry and an admin must rerun linkedin-auth.mjs soon.
 */
export async function accessToken(config, ref, now = Date.now()) {
  const snap = await ref.get();
  if (!snap.exists) throw new Error("No LinkedIn tokens stored. Run: npm run linkedin-auth");
  let record = snap.data();

  if (Date.parse(record.accessTokenExpiresAt) - now < 7 * DAY) {
    if (!record.refreshToken || Date.parse(record.refreshTokenExpiresAt) <= now) {
      throw new Error("LinkedIn authorisation has expired. An admin of the LinkedIn Page must run: npm run linkedin-auth");
    }
    record = tokenRecord(await tokenRequest(config, { grant_type: "refresh_token", refresh_token: record.refreshToken }), now, record);
    await ref.set(record);
  }
  if (Date.parse(record.accessTokenExpiresAt) <= now) {
    throw new Error("LinkedIn access token has expired. Run: npm run linkedin-auth");
  }

  const refreshLeft = record.refreshTokenExpiresAt ? Date.parse(record.refreshTokenExpiresAt) - now : Infinity;
  const warning =
    refreshLeft < 21 * DAY
      ? `LinkedIn authorisation ends on ${record.refreshTokenExpiresAt.slice(0, 10)}. An admin of the LinkedIn Page should run npm run linkedin-auth before then.`
      : null;
  return { token: record.accessToken, warning };
}

function headers(config, token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": config.version,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

/**
 * Uploads the share card so the post shows it (the Posts API doesn't scrape
 * the link). Returns an image URN, or null if anything fails; the post then
 * goes out without a thumbnail rather than not at all.
 */
export async function uploadThumbnail(config, token, imageUrl, log = console.log) {
  try {
    const image = await fetch(imageUrl);
    if (!image.ok) throw new Error(`fetching ${imageUrl}: HTTP ${image.status}`);
    const bytes = Buffer.from(await image.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) throw new Error("image over 5 MB");

    const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers: headers(config, token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ initializeUploadRequest: { owner: config.orgUrn } }),
    });
    if (!init.ok) throw new Error(`initializeUpload: HTTP ${init.status} ${await init.text()}`);
    const { value } = await init.json();

    const put = await fetch(value.uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": image.headers.get("content-type") ?? "image/png" },
      body: bytes,
    });
    if (!put.ok) throw new Error(`upload: HTTP ${put.status}`);
    return value.image;
  } catch (err) {
    log(`  LinkedIn thumbnail skipped: ${err.message}`);
    return null;
  }
}

/** Posts an article share as the organisation. Returns the post URN. */
export async function createPost(config, token, { commentary, url, title, description, thumbnail }) {
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: headers(config, token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      author: config.orgUrn,
      commentary,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: {
        article: {
          source: url,
          title: title.slice(0, 200),
          description: description.slice(0, 250),
          ...(thumbnail ? { thumbnail } : {}),
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (res.status !== 201) throw new Error(`LinkedIn post failed (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  return res.headers.get("x-restli-id");
}
