/**
 * Email colours, taken from the site's own design tokens.
 *
 * Email clients understand neither CSS variables nor oklch(), so the tokens in
 * src/app/globals.css (`:root`) are resolved and converted to hex here. Retuning
 * `--brand-hue` or `--primary` on the site retunes the emails too; nothing is
 * copied by hand.
 */

/** Used only if globals.css cannot be read or a token is missing. */
const FALLBACK = {
  background: "#fdfbfb",
  foreground: "#1c1414",
  card: "#ffffff",
  primary: "#b21f2d",
  primaryForeground: "#ffffff",
  muted: "#f7f3f3",
  mutedForeground: "#6b5f5f",
  border: "#ebe5e5",
  accent: "#f2cf6b",
  accentForeground: "#5c3f12",
};

const TOKENS = {
  background: "background",
  foreground: "foreground",
  card: "card",
  primary: "primary",
  primaryForeground: "primary-foreground",
  muted: "muted",
  mutedForeground: "muted-foreground",
  border: "border",
  accent: "accent",
  accentForeground: "accent-foreground",
};

/** `--name: value;` pairs of the first `:root { … }` block. */
function rootVariables(css) {
  const block = /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  const vars = {};
  for (const m of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

/** Replaces var(--x) with its value, a few levels deep. */
function resolve(value, vars, depth = 0) {
  if (depth > 5) return value;
  return value.replace(/var\(--([\w-]+)\)/g, (_, name) => resolve(vars[name] ?? "", vars, depth + 1));
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toHex = (x) =>
  Math.round(clamp01(x) * 255)
    .toString(16)
    .padStart(2, "0");

/** oklch(L C h) → sRGB hex (alpha ignored). https://bottosson.github.io/posts/oklab/ */
export function oklchToHex(l, c, h) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return `#${linear.map((x) => toHex(gamma(x))).join("")}`;
}

/** A CSS colour value (hex or oklch, after var() resolution) as hex, or null. */
export function cssColorToHex(value) {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    const h = hex[1];
    return h.length === 3 ? `#${[...h].map((x) => x + x).join("")}` : `#${h}`;
  }
  const ok = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/[^)]*)?\)$/.exec(v);
  if (ok) {
    const l = Number(ok[1]) / (ok[2] ? 100 : 1);
    return oklchToHex(l, Number(ok[3]), Number(ok[4]));
  }
  return null;
}

/** The email palette from the text of globals.css; missing tokens fall back. */
export function emailTheme(css = "") {
  const vars = rootVariables(css);
  const theme = { ...FALLBACK };
  for (const [key, token] of Object.entries(TOKENS)) {
    const raw = vars[token];
    const hex = raw ? cssColorToHex(resolve(raw, vars)) : null;
    if (hex) theme[key] = hex;
  }
  return theme;
}

export const DEFAULT_THEME = FALLBACK;
