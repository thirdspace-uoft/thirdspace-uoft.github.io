/**
 * Section / figure / item auto-numbering helpers.
 *
 * Centralised so every page uses the same padding, prefix, and counter
 * rules. All numbers render as zero-padded 2-digit strings to match the
 * editorial mono labels (e.g. "01", "02", "Fig. 01").
 */

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Numbered section prefix: "01" / "02" / "03". */
export function sectionNumber(n: number): string {
  return pad2(n);
}

/** Lettered section prefix used by publications: A / B / C. */
export function letterSection(n: number): string {
  return String.fromCharCode(65 + n);
}

/** Build a "Fig. 01" label from a 1-based figure number. */
export function figLabel(prefix: string, n: number): string {
  return `${prefix} ${pad2(n)}`;
}

/** "01 · Title" — used in many section header eyebrows. */
export function eyebrow(num: number, label: string): string {
  return `${pad2(num)} · ${label}`;
}
