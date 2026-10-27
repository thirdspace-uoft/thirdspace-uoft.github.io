# ThirdSpace — Next.js 16 + ShadCN UI

A Next.js 16 application with **ShadCN UI** fully integrated, set up using
guidance from the Context7 MCP for both `shadcn-ui/ui` and `vercel/next.js`.

## Stack

- **Next.js** `16.2.10` (App Router, Turbopack)
- **React** `19.2.4`
- **TypeScript** `^5`
- **Tailwind CSS** `^4` (via `@tailwindcss/postcss`)
- **ESLint** `^9` with `eslint-config-next`
- **ShadCN UI** (radix base, nova preset, neutral base color)
- **Lucide** icon library
- **Radix UI** primitives (installed transitively by ShadCN)

## Project Layout

```
thirdspace-app/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── globals.css     # Tailwind v4 entry + ShadCN CSS variables
│   │   ├── layout.tsx
│   │   └── page.tsx        # Sample ShadCN components on the homepage
│   ├── components/
│   │   └── ui/             # ShadCN components (button, card, badge, ...)
│   └── lib/
│       └── utils.ts        # `cn()` helper (clsx + tailwind-merge)
├── components.json         # ShadCN config
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

## Setup Steps (Reproducible)

### 1. Scaffold Next.js 16

```bash
npx --yes create-next-app@latest thirdspace-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --turbopack \
  --import-alias "@/*" \
  --use-npm \
  --yes
```

Flags explained:

- `--typescript` — strict TS config out of the box
- `--tailwind` — installs Tailwind v4 with `@tailwindcss/postcss`
- `--app` — uses the App Router
- `--src-dir` — keeps app code under `src/`
- `--turbopack` — enables Turbopack for `next dev`
- `--import-alias "@/*"` — matches the ShadCN default aliases

### 2. Initialize ShadCN UI

```bash
cd thirdspace-app
npx --yes shadcn@latest init \
  --base radix \
  --preset nova \
  --yes \
  --force
```

This:

- Detects Next.js + Tailwind v4
- Writes `components.json` (`radix-nova` style, `neutral` base color, CSS
  variables on, Lucide icons)
- Installs ShadCN runtime deps
- Creates `src/lib/utils.ts` with the `cn()` helper
- Updates `src/app/globals.css` with the ShadCN design tokens

### 3. Add Components

```bash
npx --yes shadcn@latest add button card badge --yes
```

Components are dropped into `src/components/ui/`. Add more any time with
`npx shadcn@latest add <name>` (e.g. `input`, `dialog`, `dropdown-menu`).

### 4. Verify

```bash
npm run build
```

The build should complete with `Compiled successfully` and produce a static
homepage route `/`.

## Sample Usage (Homepage)

`src/app/page.tsx` imports and renders the three added components:

```tsx
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

## Local Development

```bash
npm install     # only needed on a fresh clone
npm run dev     # http://localhost:3000 with Turbopack
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (next + ts config)
```

## Useful Commands

| Goal                          | Command                                        |
| ----------------------------- | ---------------------------------------------- |
| List available components     | `npx shadcn@latest add`                      |
| Add a single component        | `npx shadcn@latest add dialog`               |
| Re-run init non-interactively | `npx shadcn@latest init --preset nova --yes` |
| Type-check                    | `npx tsc --noEmit`                           |

## Content Sync with Firebase

All site content lives in `public/config/content.json` and is synced bidirectionally with Firestore (collection `config`, document `site`).

### Download from Firestore → content.json

Pulls the latest content from Firestore and writes it to `public/config/content.json`:

```bash
npm run fetch-content
```

This runs automatically as a pre-step before `npm run dev` and `npm run build`.

### Upload content.json → Firestore

Pushes the local `content.json` up to Firestore with a `lastModified` timestamp:

```bash
npm run upload-content
```

### Admin CMS (in-browser)

You can also publish directly from `/admin` — sign in, edit fields, and click **"Commit Draft"** to push changes to Firestore.

### Prerequisites

Both scripts require Firebase admin credentials from `.env`:

- `FIREBASE_SERVICE_ACCOUNT_KEY` — inline JSON string, or
- `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` — path to a `.json` key file

## Blog

Posts live in the Firestore collection `posts` (one document per post); the
blog's settings (on/off, nav label, page text) live in `config/site` under
`blog`, edited with the rest of the site settings.

`npm run fetch-content` writes the posts that are **published and due** to
`src/generated/posts.json` (gitignored). Drafts and posts scheduled for later
never reach the build; the log line `posts: N published, N scheduled, N draft`
shows why a post didn't appear.

### Building without Firebase credentials

```bash
npm run build:fixtures   # same as BLOG_FIXTURES=1 npm run build
```

`BLOG_FIXTURES=1` uses `scripts/fixtures/posts.sample.json` instead of
Firestore and turns the blog on. With credentials in `.env` it still fetches
the real `config/site`; without them it keeps an existing
`public/config/content.json`, or copies `scripts/fixtures/site.sample.json`
(a snapshot of the public site settings). The sample posts cover every
resource kind, math, code, a guest author, a renamed slug, a scheduled post and
a draft (the last two must not appear in `out/`).

### Resources (papers, code, videos, data)

At build time `fetch-content` fills in what the editor didn't type: GitHub
stars, language and license for code links, YouTube/Vimeo titles and
thumbnails, paper titles/authors/venue from Crossref (DOI) or arXiv, and
BibTeX. Lookups are cached in `.cache/resources.json` (kept between CI runs);
if an API is down the last cached answer is used, and the build never fails
over it. `SKIP_ENRICHMENT=1` uses the cache only and makes no requests.
Tests: `npm test`.

In a post body, `::resource{id="…"}` on its own line places that resource's
card or player there, and a bare YouTube, Vimeo, GitHub or arXiv link on its
own line becomes a card.

### When posts go live

The deploy workflow checks Firestore every 5 minutes and rebuilds when the
settings are saved, any post is saved, or a scheduled post's time arrives. A
post is usually live 5–10 minutes after it is saved or becomes due.

### Search engines and AI search

The build writes `sitemap.xml` (with video entries), `robots.txt` (AI
crawlers explicitly allowed, `/admin` excluded), `llms.txt`,
`blog/rss.xml`, `blog/feed.json`, a Markdown copy of each post at
`/blog/<slug>/index.md`, a 1200×630 share card per post at
`/blog/<slug>/og.png`, and schema.org data on every page (lab, people,
posts with their papers, code, data and videos).

One-time manual steps after launch:

1. Verify the site in [Google Search Console](https://search.google.com/search-console)
   and [Bing Webmaster Tools](https://www.bing.com/webmasters) (HTML-file
   verification: put the file they give you in `public/`). Submit
   `https://thirdspace-uoft.github.io/sitemap.xml` in both.
2. Check a post with Google's [Rich Results Test](https://search.google.com/test/rich-results)
   and the [Schema.org validator](https://validator.schema.org/), and its share
   card with LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/).

If the lab moves to a university subdomain, change `SITE_URL` in
`src/lib/site.ts` and add `public/CNAME`; canonical URLs, feeds and the
sitemap all follow. Do it before sharing many posts, since shared links would
otherwise point at the old address.

### Firestore rules

`firestore.rules` only lets the listed admin emails write. Fill in the list,
then deploy with `firebase deploy --only firestore:rules`. Also disable new
account sign-up for Email/Password in the Firebase console (Authentication →
Settings → User actions), so nobody can create an account through the Auth API.

## Notes on Tailwind v4

There is no `tailwind.config.js` in this project. Tailwind v4 is configured
through `postcss.config.mjs` (the `@tailwindcss/postcss` plugin) and
`src/app/globals.css` via `@import "tailwindcss";` plus ShadCN's CSS variable
theme. The empty `tailwind.config` field in `components.json` is intentional
and matches the official ShadCN template.

## References

- Next.js docs — `https://nextjs.org/docs`
- ShadCN UI docs — `https://ui.shadcn.com/docs`
- Context7 MCP queries used while building this repo
