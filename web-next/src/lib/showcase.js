// Showcase: artists' pieces shared from YOUrigin, shown on YOU with credit
// and links for how to support them. Pure helpers only (no Supabase), so
// they can be tested; the calls live in showcaseApi.js.

export const PLACEMENTS = {
  home_background: "Home background",
  featured_words: "Featured words",
  gallery: "Gallery"
};

export const LINK_KINDS = {
  kofi: "Ko-fi",
  paypal: "PayPal",
  patreon: "Patreon",
  instagram: "Instagram",
  website: "Website",
  other: "Link"
};

/** The live piece showing in a placement now: the one featured most recently. */
export function pickFeatured(works, placement) {
  let best = null;
  for (const w of works || []) {
    if (w.status !== "live" || !(w.placements || []).includes(placement)) continue;
    const at = Date.parse(w.featured_at || w.live_at || w.created_at || 0) || 0;
    const bestAt = best ? Date.parse(best.featured_at || best.live_at || best.created_at || 0) || 0 : -1;
    if (at > bestAt) best = w;
  }
  return best;
}

/** Only https links are ever shown, so a piece can't point anywhere odd. */
export function safeUrl(url) {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** An artist's support links, cleaned: https only, a label for each. */
export function supportLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map(l => {
      const url = safeUrl(l?.url);
      if (!url) return null;
      const kind = LINK_KINDS[l.kind] ? l.kind : "other";
      const label = (typeof l.label === "string" && l.label.trim()) || LINK_KINDS[kind];
      return { kind, label, url };
    })
    .filter(Boolean);
}

const HANDLE = /^@([a-z0-9_]{1,30})@([a-z0-9.-]+\.[a-z]{2,})$/i;

/** "ana@kronk.social" or "@ana@kronk.social" → "@ana@kronk.social"; "" stays ""; otherwise null. */
export function normalizeHandle(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  const m = s.replace(/^@/, "").match(HANDLE_BARE);
  return m ? `@${m[1]}@${m[2].toLowerCase()}` : null;
}
const HANDLE_BARE = /^([a-z0-9_]{1,30})@([a-z0-9.-]+\.[a-z]{2,})$/i;

/** Adds https:// when missing; only https is allowed. "" stays ""; otherwise null. */
export function normalizeUrl(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  return safeUrl(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
}

/** "@name@kronk.social" → its profile page on that server, or null. */
export function kronkProfileUrl(handle) {
  const m = typeof handle === "string" ? handle.trim().match(HANDLE) : null;
  return m ? `https://${m[2].toLowerCase()}/@${m[1]}` : null;
}

/**
 * Whether a viewer can keep a piece in their collection now. A piece that
 * asks for a contribution first needs "I've contributed" (honour-based).
 */
export function saveGate(work, contributed) {
  if (!work || work.status !== "live") return { ok: false, reason: "not-live" };
  if (work.save_mode === "contribution" && !contributed) return { ok: false, reason: "needs-contribution" };
  return { ok: true, reason: null };
}

/** "By Ana · offered by Ben and Cleo" */
export function creditLine(artistName, credits) {
  const by = artistName ? `By ${artistName}` : "";
  const offered = (credits || []).filter(c => c.role === "offered_by").map(c => c.name).filter(Boolean);
  if (!offered.length) return by;
  const names = offered.length === 1 ? offered[0] : `${offered.slice(0, -1).join(", ")} and ${offered[offered.length - 1]}`;
  return by ? `${by} · offered by ${names}` : `Offered by ${names}`;
}

// How the home background art sits behind the welcome: remembered on this
// device only.
export const BACKGROUND_MODES = [
  { value: "full", label: "Full" },
  { value: "dim", label: "Dimmed" },
  { value: "blur", label: "Blurred" },
  { value: "off", label: "Off" }
];
const BG_KEY = "you.showcaseBackground";

export function backgroundMode() {
  try {
    const v = localStorage.getItem(BG_KEY);
    return BACKGROUND_MODES.some(m => m.value === v) ? v : "full";
  } catch {
    return "full";
  }
}

export function setBackgroundMode(v) {
  try { localStorage.setItem(BG_KEY, v); } catch { /* private mode: just this visit */ }
}

export function backgroundClass(mode) {
  if (mode === "dim") return "brightness-[0.7] saturate-[0.85]";
  if (mode === "blur") return "blur-[6px] scale-[1.06]";
  return "";
}

/** Shortens text to fit, ending at a sentence if one fits, else at a word, never mid-word. */
export function fitText(text, max) {
  const s = (text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf(".\n"));
  if (sentence >= max / 2) return cut.slice(0, sentence + 1).trim();
  const space = cut.slice(0, max - 1).lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max - 1).trimEnd()}…`;
}
