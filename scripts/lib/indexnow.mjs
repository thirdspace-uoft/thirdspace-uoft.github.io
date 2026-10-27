// IndexNow tells Bing (whose index also feeds Copilot and ChatGPT search) and
// Yandex that pages changed, instead of waiting for a crawl. Google doesn't
// use it; it reads the sitemap.
//
// The key is public by design: the file public/<key>.txt proves the site
// owns it. To rotate, replace both this value and that file.
export const INDEXNOW_KEY = "239a413b1ca9040834941cafaa5df34a";

export async function pingIndexNow(siteUrl, urls, log = console.log) {
  if (urls.length === 0) return;
  const host = new URL(siteUrl).host;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`, urlList: urls }),
    });
    log(`IndexNow: ${urls.length} URL(s), HTTP ${res.status}`);
  } catch (err) {
    log(`IndexNow failed (not fatal): ${err.message}`);
  }
}
