import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DEFAULT_THEME, cssColorToHex, emailTheme, oklchToHex } from "./email-theme.mjs";

test("oklch converts to the expected sRGB hex", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
  // oklch(0.628 0.2577 29.23) is CSS red.
  assert.equal(oklchToHex(0.62796, 0.25768, 29.2339), "#ff0000");
});

test("cssColorToHex reads hex and oklch, and rejects the rest", () => {
  assert.equal(cssColorToHex("#B21F2D"), "#b21f2d");
  assert.equal(cssColorToHex("#fff"), "#ffffff");
  assert.equal(cssColorToHex("oklch(100% 0 0)"), "#ffffff");
  assert.equal(cssColorToHex("oklch(1 0 0 / 50%)"), "#ffffff");
  assert.equal(cssColorToHex("rgb(1 2 3)"), null);
});

test("emailTheme resolves var(--brand-hue) and falls back per token", () => {
  const css = ":root {\n  --brand-hue: 20;\n  --primary: #B21F2D;\n  --border: oklch(0.92 0.01 var(--brand-hue));\n}\n";
  const theme = emailTheme(css);
  assert.equal(theme.primary, "#b21f2d");
  assert.match(theme.border, /^#[0-9a-f]{6}$/);
  assert.equal(theme.card, DEFAULT_THEME.card); // not in this css → fallback
  assert.deepEqual(emailTheme(""), DEFAULT_THEME);
});

test("the real globals.css yields a full palette", () => {
  const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf-8");
  const theme = emailTheme(css);
  for (const value of Object.values(theme)) assert.match(value, /^#[0-9a-f]{6}$/);
  assert.equal(theme.primary, "#b21f2d");
});
