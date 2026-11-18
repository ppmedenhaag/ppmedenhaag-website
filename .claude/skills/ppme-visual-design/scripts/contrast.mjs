// WCAG contrast checker for PPME design tokens.
// Usage: node .claude/skills/ppme-visual-design/scripts/contrast.mjs
// Keep colors in sync with the @theme block in src/styles/global.css
// (brand tokens are shared with event-registration/web/app/app.css).

const c = {
  white: "#ffffff",
  slate50: "#f8fafc", slate500: "#64748b", slate700: "#334155", slate900: "#0f172a",
  brand: "#034ea2", brandDark: "#023771", brand50: "#ebf1f8", brand100: "#d7e3f0",
  brand200: "#b3cae3", emerald50: "#ecfdf5", emerald800: "#065f46", amber50: "#fffbeb", amber900: "#78350f",
  red50: "#fef2f2", red800: "#991b1b", brand100x: "#d7e3f0", brand300: "#81a6d0", brandDarker: "#022954", brandDarkest: "#011c3b",
};

// [foreground, background, minimum ratio, label]
const pairs = [
  ["slate900", "white", 4.5, "headings on white"],
  ["slate700", "white", 4.5, "body on white"],
  ["slate500", "white", 4.5, "secondary text on white"],
  ["slate500", "slate50", 4.5, "secondary text on page backdrop"],
  ["slate700", "brand50", 4.5, "body on tinted surface"],
  ["white", "brand", 4.5, "primary button text"],
  ["white", "brandDark", 4.5, "primary button hover"],
  ["brand", "white", 4.5, "link on white"],
  ["brand", "brand50", 4.5, "link on tinted surface"],
  ["brandDark", "brand50", 4.5, "table header text"],
  ["brand100", "brandDarker", 4.5, "footer text"],
  ["brand200", "brandDarker", 4.5, "footer links"],
  ["white", "brandDarkest", 4.5, "text on darkest band"],
  ["brand", "white", 3.0, "focus ring / UI border on white"],
  // Migrated-content shims (.prose buttons, badges, accordion, alerts)
  ["white", "brand", 4.5, "legacy .btn-primary / .btn-info text"],
  ["white", "brandDark", 4.5, "legacy .btn hover text"],
  ["brandDark", "brand50", 4.5, "legacy .badge"],
  ["emerald800", "emerald50", 4.5, "legacy .badge-success"],
  ["amber900", "amber50", 4.5, "legacy .badge-warning"],
  ["red800", "red50", 4.5, "legacy .badge-danger"],
  ["brandDarker", "brand50", 4.5, "legacy .alert-primary / accordion header"],
  ["brandDarker", "brand100x", 4.5, "accordion header hover"],
  // Expected to FAIL as text: documents why brand-300 is not for text on white.
  // ["brand300", "white", 4.5, "brand-300 text on white (don't)"],
];

const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => lin(x / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failed = 0;
for (const [fg, bg, min, label] of pairs) {
  const r = ratio(c[fg], c[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`);
}
process.exit(failed ? 1 : 0);
