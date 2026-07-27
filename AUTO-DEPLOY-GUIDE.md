# Auto-Deploy Guide — Admin CMS → GitHub Pages

When content is saved in the admin CMS, automatically trigger a GitHub Actions build & deploy to GitHub Pages.

---

## Architecture

```
Admin saves to Firestore
  → 2-min cooldown check (localStorage)
  → POST GitHub API → workflow_dispatch
  → GitHub Actions builds & deploys
  → Site updates ~2–3 min later
```

---

## 1. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      commit_message:
        description: "Triggered from admin CMS"
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
          FIREBASE_SERVICE_ACCOUNT_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}
          NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: ${{ secrets.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT }}
          NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: ${{ secrets.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY }}
          IMAGEKIT_PRIVATE_KEY: ${{ secrets.IMAGEKIT_PRIVATE_KEY }}

      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 2. Admin Page — Deploy Trigger

In `src/app/admin/page.tsx`, modify `handlePublish` to trigger deploy after saving to Firestore:

### Add cooldown + deploy logic after `setDoc` succeeds:

```tsx
// After successful setDoc
await triggerDeploy();
```

### Trigger function (add to component):

```tsx
async function triggerDeploy() {
  const cooldownKey = "ts_deploy_cooldown";
  const last = localStorage.getItem(cooldownKey);
  if (last && Date.now() - Number(last) < 120_000) {
    setMessage({
      type: "success",
      text: "Published to Firestore. Deploy skipped (cooldown <2min).",
    });
    return;
  }

  const pat = localStorage.getItem("ts_gh_pat");
  if (!pat) {
    setMessage({
      type: "error",
      text: "Published to Firestore. Set a GitHub PAT in Settings to enable auto-deploy.",
    });
    return;
  }

  const repo = "critical-nlp/thirdspace.toronto.edu";

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pat}`,
          "Content-Type": "application/json",
          "User-Agent": "thirdspace-admin",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);

    localStorage.setItem(cooldownKey, String(Date.now()));
    setMessage({
      type: "success",
      text: "Published & deploy triggered! Site will update in ~2–3 min.",
    });
  } catch (err: any) {
    setMessage({
      type: "error",
      text: `Published to Firestore, but deploy trigger failed: ${err.message}`,
    });
  }
}
```

---

## 3. Admin Settings — PAT Input

In the admin page's Settings tab, add a field for the GitHub PAT:

```tsx
// State
const [ghPat, setGhPat] = useState("");

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem("ts_gh_pat") ?? "";
  setGhPat(saved);
}, []);

// Save handler
function savePat() {
  localStorage.setItem("ts_gh_pat", ghPat);
  setMessage({ type: "success", text: "GitHub PAT saved locally." });
}
```

UI (add to settings tab panel):

```tsx
<div className="flex flex-col gap-4">
  <h3 className="text-sm font-mono uppercase tracking-wider">GitHub Auto-Deploy</h3>
  <p className="text-xs text-muted-foreground">
    A PAT with <code>repo</code> and <code>workflow</code> scopes is needed to
    trigger builds from the admin CMS.
  </p>
  <Label>Personal Access Token (PAT)</Label>
  <Input
    type="password"
    value={ghPat}
    onChange={(e) => setGhPat(e.target.value)}
    placeholder="ghp_..."
  />
  <Button onClick={savePat} size="sm" className="w-fit">
    Save Token
  </Button>
</div>
```

---

## 4. Repo Secrets

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAJt7TNw6WDbIm_l3bYtR9oVFwLAMldlKQ` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `thirdspace-uoft.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `thirdspace-uoft` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `thirdspace-uoft.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `993030008909` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:993030008909:web:c97e82d93a635ffdfe6c04` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full JSON content of the service account key file |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | `https://ik.imagekit.io/6lrshzb1q` |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | `public_ceZcPfhgVnUzLdYrWwlIHNbe0eI=` |
| `IMAGEKIT_PRIVATE_KEY` | `private_2SzHE4jnHyc1KhJUQ6dZykIKxh4=` |

---

## 5. Create a PAT

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select scopes: **`repo`** (full control) and **`workflow`**
4. Copy the token and paste it into the admin CMS Settings tab
5. The token is stored in `localStorage` (never sent to any server except GitHub API)

---

## 6. Cooldown Behavior

| Action | Cooldown resets? |
|--------|-----------------|
| First save after deploy | Triggers a new deploy |
| Save within 2 min of last trigger | Skipped — message says "cooldown" |
| After 2 min elapses | Next save triggers again |

The cooldown timestamp is stored in `localStorage` under `ts_deploy_cooldown`.

---

## 7. Manual Fallback

If auto-deploy fails, you can always deploy manually:

```bash
npm run build
# commit & push out/ directory, or use GitHub Actions manually
```

Or trigger the workflow from **GitHub → Actions → Deploy → Run workflow**.
