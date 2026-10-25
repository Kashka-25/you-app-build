// The five Elements as section accents (design/yin-yang). The ocean-and-
// cosmos theme is the frame; each section of YOU wears one Element, drawn
// from the Codex's own meanings:
//   Water · feeling, flow, care            → Reflections
//   Fire  · will, action, aliveness        → Pursue, Focus
//   Earth · grounding, the tangible        → Today (Threshold, Sow, Harvest), Wanderings
//   Air   · mind, voice, perspective       → YOUniversity and its courses
//   Ether · spirit, meaning, the greater   → YOUrney, The Mirror, Legacy, My Story
// Home, the YOU tab and everything else keep the gold ring that holds all five.
//
// The accent shows in four places only: section labels, the bottom-nav
// marker, a thin line along the top of cards, and the selected tab's
// underline. Buttons never change. Colours live in styles/tokens.css.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SECTIONS = [
  ["/reflections", "water"],
  ["/pursue", "fire"],
  ["/focus", "fire"],
  ["/threshold", "earth"],
  ["/sow", "earth"],
  ["/harvest", "earth"],
  ["/wandering", "earth"],
  ["/youniversity", "air"],
  ["/learn", "air"],
  ["/journey", "ether"],
  ["/mirror", "ether"],
  ["/legacy", "ether"],
  ["/my-story", "ether"]
];

export function elementForPath(pathname) {
  return SECTIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"))?.[1] || null;
}

// Sets data-element on <html> for the current section, so every screen,
// modal and full-screen layer picks up the same accent.
export function useSectionElement() {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = elementForPath(pathname);
    if (el) document.documentElement.setAttribute("data-element", el);
    else document.documentElement.removeAttribute("data-element");
  }, [pathname]);
}

// A value's own Element colour (Codex element name → CSS variable).
export function elementColor(element) {
  return element ? `var(--el-${element.toLowerCase()})` : "var(--gold)";
}

// Values sharing an Element each get their own shade of it, lighter or
// deeper in turn (Cassidy, Oct 24: "different shades within their
// element's palette"). Steady per value: its place among that Element's
// values, alphabetically. `byName` is VALUE_ELEMENT.
const SHADES = [0, 22, -22, 38, -36, 12, -12, 30, -28];
export function valueShade(name, byName) {
  const element = byName[name];
  if (!element) return null;
  const base = elementColor(element);
  const kin = Object.keys(byName).filter(n => byName[n] === element).sort();
  const step = SHADES[kin.indexOf(name) % SHADES.length] || 0;
  if (step === 0) return base;
  return `color-mix(in oklab, ${base} ${100 - Math.abs(step)}%, ${step > 0 ? "white" : "black"})`;
}
