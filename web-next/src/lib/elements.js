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
