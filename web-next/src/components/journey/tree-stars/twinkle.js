// Shared by the night skies (The Story of You, Life Constellations).
// Render <style>{TWINKLE_CSS}</style> once inside the sky, then give each
// star className="sboy-tw" and style={twinkle(...)} or randomTwinkle(...).
// ── Realistic twinkle (scintillation) ──
// Real stars don't pulse on a smooth wave: atmospheric turbulence makes
// brightness flicker irregularly, mostly in brighter stars, while faint
// ones barely change. So: three uneven flicker patterns (multipliers of
// each star's own brightness), each star on its own speed and offset so
// none move in step, and an amplitude that scales with brightness. Bright
// stars also catch a faint warm/cool tint now and then. Respects
// prefers-reduced-motion (a still sky).
const FLICKER = [
  [0, 1], [6, 0.62], [11, 0.94], [19, 0.74], [27, 1], [41, 0.86], [48, 0.5], [53, 0.97], [66, 0.82], [79, 1], [87, 0.66], [93, 0.92], [100, 1]
];
const FLICKER_B = [
  [0, 0.9], [9, 1], [17, 0.7], [23, 0.95], [38, 0.8], [44, 1], [57, 0.58], [61, 0.9], [74, 1], [83, 0.76], [100, 0.9]
];
const FLICKER_C = [
  [0, 1], [14, 0.84], [22, 1], [31, 0.66], [35, 0.92], [52, 1], [63, 0.72], [70, 0.96], [81, 0.86], [90, 1], [100, 1]
];
function flickerKeyframes(name, steps) {
  // opacity = base × (1 − amplitude × (1 − step))
  return `@keyframes ${name} {${steps
    .map(([pct, k]) => `${pct}% { opacity: calc(var(--o) * (1 - var(--a) * ${(1 - k).toFixed(2)})); }`)
    .join(" ")}}`;
}
export const TWINKLE_CSS = `
  ${flickerKeyframes("sboyFlickerA", FLICKER)}
  ${flickerKeyframes("sboyFlickerB", FLICKER_B)}
  ${flickerKeyframes("sboyFlickerC", FLICKER_C)}
  @keyframes sboyTint { 0%, 100% { fill: #EDE6D6; } 31% { fill: #F5ECD9; } 34% { fill: #E2EAFF; } 37% { fill: #EDE6D6; } 72% { fill: #FFF1DA; } 75% { fill: #EDE6D6; } }
  @media (prefers-reduced-motion: reduce) { .sboy-tw { animation: none !important; } }
`;
export const PATTERNS = ["sboyFlickerA", "sboyFlickerB", "sboyFlickerC"];

// One star's twinkle: base brightness o (0–1) and how much it flickers.
export function twinkle(o, amplitude, duration, offset, pattern, tint = false) {
  const anims = [`${pattern} ${duration}s linear -${offset}s infinite`];
  if (tint) anims.push(`sboyTint ${duration * 3.3}s linear -${offset}s infinite`);
  return { "--o": o, "--a": amplitude, opacity: o, animation: anims.join(", ") };
}
export function randomTwinkle(r, bright) {
  const o = bright ? 0.95 : Math.min(0.75, 0.25 + r * 0.32);
  const amplitude = bright ? 0.45 : r > 0.9 ? 0.28 : r > 0.6 ? 0.16 : 0.07;
  const duration = bright ? 2.4 + Math.random() * 2.2 : 4 + Math.random() * 5;
  return twinkle(o, amplitude, +duration.toFixed(2), +(Math.random() * duration).toFixed(2), PATTERNS[Math.floor(Math.random() * 3)], bright);
}
