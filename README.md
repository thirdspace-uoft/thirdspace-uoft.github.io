# Thirdspace — Next.js 16 + ShadCN UI

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

| Goal                          | Command                                       |
| ----------------------------- | --------------------------------------------- |
| List available components     | `npx shadcn@latest add`                       |
| Add a single component        | `npx shadcn@latest add dialog`                |
| Re-run init non-interactively | `npx shadcn@latest init --preset nova --yes`  |
| Type-check                    | `npx tsc --noEmit`                            |

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
