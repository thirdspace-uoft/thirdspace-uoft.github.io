# Thirdspace Web Application Initialization & Overview

Welcome to the **Thirdspace** research group website codebase (University of Toronto). This repository is a statically-exported Next.js web application utilizing Tailwind CSS v4 and shadcn/ui component primitives, designed for high-performance deployment to GitHub Pages.

---

## 1. Project Architecture & Stack

- **Framework**: Next.js 15+ (App Router) configured for fully static exports (`output: "export"`, exports to `/out`).
- **Styling**: Tailwind CSS v4 (configured in `src/app/globals.css` with `@import "tailwindcss"`) and shadcn/ui components (`src/components/ui/*`).
- **Theme**: Solarpunk aesthetic. Light theme only (no `dark:` variants). Cohesion is anchored by `--brand-hue` (value `265`, producing UofT Blue Pantone 655 / `#002A5C`) and paired with a warm gold accent (`--accent` / `#80`).
- **Icons**: `lucide-react`.

---

## 2. Critical Conventions & Development Guide

### A. Asset Resolution via `getAssetPath()`
The production site is served under a custom subpath (`/thirdspace.toronto.edu/`). To avoid broken paths (404 errors) on GitHub Pages, **all public assets must be wrapped in `getAssetPath()`** from `src/lib/utils.ts`.
- **In JSX/TSX code**:
  ```tsx
  import { getAssetPath } from "@/lib/utils";
  <img src={getAssetPath("/headshots/ishtique-ahmed.png")} alt="PI" />
  ```
- **In `content.json`**: Store them as root-relative paths (e.g., `"/headshots/member.png"`) and let the consuming page wrap the value with `getAssetPath()`.

### B. Single Source of Truth: `public/config/content.json`
To keep the site entirely dynamic and maintainable without code changes:
- **No hardcoded text** or links are permitted in pages (`page.tsx`, `layout.tsx`, etc.).
- All typography, headings, taglines, lists, coordinates, addresses, and menu navigation links must be loaded from `public/config/content.json`.

### C. Client-Side CMS: `/admin`
A static-gated administration console is located at `src/app/admin/page.tsx`.
- **Authentication**: JWT-based session security handled fully on the client (`localStorage`).
- **CMS Synchronization**:
  1. **Direct Commit**: Pushes live edits back to the GitHub repository's `content.json` file using the GitHub Contents API (requires a Personal Access Token stored in the browser).
  2. **Backup**: Allows direct local downloading of the updated `content.json`.

---

## 3. Directory Map & Core Files

| File/Folder Path | Purpose / Concern |
| :--- | :--- |
| `public/config/content.json` | **Site Copy Database**: The single source of truth for all text copy and data. |
| `src/app/admin/page.tsx` | **Admin CMS Panel**: Configuration manager and GitHub deployment engine. |
| `src/app/page.tsx` | **Home Page**: Hero presentation, research posture, and core pillars. |
| `src/app/team/page.tsx` | **Team Page**: Unified roster for faculty, doctoral students, and alumni. |
| `src/app/publications/page.tsx` | **Publications Page**: Book cards and year-grouped research artifacts. |
| `src/app/about/page.tsx` | **About Page**: Extended mission statement, methods, and affiliations. |
| `src/app/contact/page.tsx` | **Contact Page**: Contact links, physical office details, and interactive map locator. |
| `src/components/brand-mark.tsx` | **Brand Identity**: Shared SVG marks for the University of Toronto logo. |
| `src/lib/utils.ts` | Utilities, including the critical environment-aware `getAssetPath()`. |
| `src/app/globals.css` | Design system variables (`--background`, `--primary`, `--accent`, etc.). |
| `next.config.ts` | Next.js compilation settings (HMR configuration and static base path mapping). |
| `CLAUDE.md` | Quick instructions and stack conventions for Claude Code. |

---

## 4. Local Workspace Operations

- **Development Server**: Run `npm run dev` (starts on `http://localhost:3000`).
- **Static Compilation**: Run `npm run build` to output static assets directly into the `/out` directory.
- **Production Target URL**: [thirdspace.toronto.edu on GitHub Pages](https://critical-nlp.github.io/thirdspace.toronto.edu/)
