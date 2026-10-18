// The colour scale: each Seeker slides YOU's backgrounds along Nature's
// palette by day (bark brown → sand → snow white → moss green) and along
// the Cosmos by night (void → midnight → nebula → aurora). Only the grounds
// move (page, card and field surfaces, and the sky behind them); ink, gold
// and accents stay put, so words read the same at every point.
//
// Kept per account (auth prefs.colour_scale) and on the device, where
// index.html applies the last colours before the first paint (no flash).

const LIGHT_STOPS = [
  { label: "Bark", bg: "#E9DAC5", s1: "#E0CDB3", s2: "#F2E7D7", s3: "#D3BC9C" },
  { label: "Sand", bg: "#F7F1E8", s1: "#F0E6D8", s2: "#FBF7F0", s3: "#E5D6C2" },
  { label: "Snow", bg: "#FBFAF7", s1: "#F3F1EC", s2: "#FFFFFF", s3: "#E7E3DB" },
  { label: "Moss", bg: "#EDF1E2", s1: "#E1E8D1", s2: "#F7F9EF", s3: "#D0DABD" }
];
const DARK_STOPS = [
  { label: "Void", bg: "#050510", s1: "#0C0C1D", s2: "#101024", s3: "#1B1A34" },
  { label: "Midnight", bg: "#0B0B1F", s1: "#131331", s2: "#19193D", s3: "#25244E" },
  { label: "Nebula", bg: "#130E2C", s1: "#1D1643", s2: "#241B51", s3: "#322768" },
  { label: "Aurora", bg: "#06191F", s1: "#0B242C", s2: "#0F2B35", s3: "#193B47" }
];
export const SCALE_STOPS = { light: LIGHT_STOPS, dark: DARK_STOPS };
// Where today's palette sits: Sand by day, Midnight by night.
export const SCALE_DEFAULT = 100 / 3;

const STORE = "you.scale";       // { light, dark } positions, 0–100
const VARS = "you.scale.vars";   // { light: {...}, dark: {...} } for index.html

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = rgb => "#" + rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

// The four surface colours at a position along a mode's stops.
export function coloursAt(mode, pos) {
  const stops = SCALE_STOPS[mode];
  const x = (Math.min(100, Math.max(0, pos)) / 100) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const t = x - i;
  const [a, b] = [stops[i], stops[i + 1]];
  return { bg: mix(a.bg, b.bg, t), s1: mix(a.s1, b.s1, t), s2: mix(a.s2, b.s2, t), s3: mix(a.s3, b.s3, t) };
}

// The nearest stop's name, for the slider's label.
export function stopName(mode, pos) {
  const stops = SCALE_STOPS[mode];
  return stops[Math.round((pos / 100) * (stops.length - 1))].label;
}

function sky(mode, c) {
  if (mode === "light") {
    return [
      "radial-gradient(1100px 520px at 50% -8%, rgba(255, 248, 234, 0.95) 0%, rgba(255, 248, 234, 0) 60%)",
      "radial-gradient(900px 480px at 8% 108%, rgba(142, 78, 48, 0.10) 0%, rgba(142, 78, 48, 0) 65%)",
      "radial-gradient(700px 420px at 96% 100%, rgba(196, 150, 70, 0.12) 0%, rgba(196, 150, 70, 0) 60%)",
      `linear-gradient(180deg, ${mix(c.s2, c.bg, 0.5)} 0%, ${c.s1} 100%)`
    ].join(", ");
  }
  return [
    "radial-gradient(1px 1px at 12% 18%, rgba(255, 255, 255, 0.8) 50%, transparent 51%)",
    "radial-gradient(1px 1px at 34% 62%, rgba(255, 255, 255, 0.55) 50%, transparent 51%)",
    "radial-gradient(1.5px 1.5px at 58% 28%, rgba(255, 244, 214, 0.85) 50%, transparent 51%)",
    "radial-gradient(1px 1px at 76% 74%, rgba(255, 255, 255, 0.5) 50%, transparent 51%)",
    "radial-gradient(1px 1px at 88% 12%, rgba(255, 255, 255, 0.7) 50%, transparent 51%)",
    "radial-gradient(1px 1px at 22% 88%, rgba(255, 255, 255, 0.45) 50%, transparent 51%)",
    "radial-gradient(900px 520px at 85% -5%, rgba(108, 104, 182, 0.22) 0%, rgba(108, 104, 182, 0) 62%)",
    "radial-gradient(800px 480px at 5% 105%, rgba(31, 122, 130, 0.16) 0%, rgba(31, 122, 130, 0) 60%)",
    `linear-gradient(180deg, ${mix(c.bg, c.s1, 0.35)} 0%, ${mix(c.bg, "#000000", 0.08)} 100%)`
  ].join(", ");
}

// CSS variables for a mode at a position, or null at the default (so the
// stylesheet's own values apply untouched).
export function varsFor(mode, pos) {
  if (Math.abs(pos - SCALE_DEFAULT) < 0.5) return null;
  const c = coloursAt(mode, pos);
  return { "--bg": c.bg, "--surface-1": c.s1, "--surface-2": c.s2, "--surface-3": c.s3, "--sky": sky(mode, c) };
}

const NAMES = ["--bg", "--surface-1", "--surface-2", "--surface-3", "--sky"];

export function readScale() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || "{}");
    return { light: Number.isFinite(s.light) ? s.light : SCALE_DEFAULT, dark: Number.isFinite(s.dark) ? s.dark : SCALE_DEFAULT };
  } catch {
    return { light: SCALE_DEFAULT, dark: SCALE_DEFAULT };
  }
}

const currentMode = () => (document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light");

// Paint the current mode's colours onto the page.
export function applyScale(scale = readScale()) {
  const root = document.documentElement;
  const vars = varsFor(currentMode(), scale[currentMode()]);
  NAMES.forEach(n => (vars ? root.style.setProperty(n, vars[n]) : root.style.removeProperty(n)));
}

// Remember a scale on this device (and the painted values for index.html).
export function storeScale(scale) {
  try {
    localStorage.setItem(STORE, JSON.stringify(scale));
    localStorage.setItem(VARS, JSON.stringify({ light: varsFor("light", scale.light), dark: varsFor("dark", scale.dark) }));
  } catch { /* this visit only */ }
}

// Re-paint whenever the mode flips, wherever it's flipped from.
let watching = false;
export function watchMode() {
  if (watching || typeof MutationObserver === "undefined") return;
  watching = true;
  new MutationObserver(() => applyScale()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
}
