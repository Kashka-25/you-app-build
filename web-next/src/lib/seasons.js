import { useAuth } from "./AuthContext";
import { localDateKey } from "./week";

// Nature's seasons (Cassidy, Oct 28): the year turns at the solstices and
// equinoxes. When it turns, YOU invites a Season review of the three months
// just ended; the two equinoxes, the balance points, open a deeper review of
// the last six months. Hemisphere matters: March brings autumn in the south
// and spring in the north.

// Close enough for a reflection (the real moment moves by a day or so).
const TURNS = [
  { month: 3, day: 20, kind: "equinox" },
  { month: 6, day: 21, kind: "solstice" },
  { month: 9, day: 22, kind: "equinox" },
  { month: 12, day: 21, kind: "solstice" }
];

// The season each turning begins.
const BEGINS = {
  south: { 3: "Autumn", 6: "Winter", 9: "Spring", 12: "Summer" },
  north: { 3: "Spring", 6: "Summer", 9: "Autumn", 12: "Winter" }
};

const key = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Every turning, newest first, from next year back two years.
function turnings(today = localDateKey()) {
  const year = Number(today.slice(0, 4));
  const list = [];
  for (let y = year + 1; y >= year - 2; y--) {
    for (let i = TURNS.length - 1; i >= 0; i--) {
      const t = TURNS[i];
      list.push({ date: key(y, t.month, t.day), month: t.month, kind: t.kind });
    }
  }
  return list;
}

// A guess from the device's time zone; the Seeker confirms it.
export function guessHemisphere() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^(Australia|Antarctica)\//.test(tz)) return "south";
    if (/^Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea|Port_Moresby)/.test(tz)) return "south";
    if (/^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima)/.test(tz)) return "south";
    if (/^Africa\/(Johannesburg|Maputo|Harare|Windhoek|Lusaka|Gaborone|Maseru|Mbabane)/.test(tz)) return "south";
    if (/^Indian\/(Mauritius|Reunion|Antananarivo)/.test(tz)) return "south";
  } catch { /* fall through */ }
  return "north";
}

export function useHemisphere() {
  const { prefs, setPrefs } = useAuth();
  return {
    hemisphere: prefs?.hemisphere || guessHemisphere(),
    chosen: Boolean(prefs?.hemisphere),
    setHemisphere: h => setPrefs({ hemisphere: h })
  };
}

function seasonEnding(t, hemisphere) {
  // The season that ends at turning t is the one the previous turning began.
  const prevMonth = t.month === 3 ? 12 : t.month - 3;
  return BEGINS[hemisphere][prevMonth];
}

// The review due now: the latest turning on or before today. Its window is
// the three months before it, or six at an equinox.
export function latestReview(hemisphere, today = localDateKey()) {
  const list = turnings(today);
  const i = list.findIndex(t => t.date <= today);
  const t = list[i];
  const back = t.kind === "equinox" ? 2 : 1;
  const from = list[i + back].date;
  const ending = seasonEnding(t, hemisphere);
  const beginning = BEGINS[hemisphere][t.month];
  const deeper = t.kind === "equinox";
  return {
    turning: t.date,
    kind: deeper ? "equinox" : "season",
    from,
    to: t.date,
    ending,
    beginning,
    title: deeper ? "Your Equinox review" : `Your ${ending} review`,
    subtitle: deeper
      ? `Six months of light and shadow, as ${ending.toLowerCase()} turns to ${beginning.toLowerCase()}`
      : `The three months of ${ending.toLowerCase()}, as ${beginning.toLowerCase()} begins`
  };
}

// The Home nudge shows for three weeks after a turning, until reviewed.
export const NUDGE_DAYS = 21;
export function nudgeDue(review, seasons, today = localDateKey()) {
  const done = seasons.some(s => s.based_on?.turning === review.turning);
  if (done) return false;
  const d1 = new Date(review.turning + "T00:00:00");
  const d2 = new Date(today + "T00:00:00");
  return (d2 - d1) / 86400000 <= NUDGE_DAYS;
}

export function niceRange(from, to) {
  const f = d => new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(from)} – ${f(to)}`;
}

// Each season's own light, for the review's backdrop.
export const SEASON_SKY = {
  Summer: "linear-gradient(160deg, #F3C977 0%, #E08A4F 45%, #6E3B2A 100%)",
  Autumn: "linear-gradient(160deg, #D9A15B 0%, #A8562F 50%, #3B2418 100%)",
  Winter: "linear-gradient(160deg, #9BB3C9 0%, #4C5F7A 50%, #141B2B 100%)",
  Spring: "linear-gradient(160deg, #CFE3B0 0%, #7FA36A 50%, #2F4529 100%)",
  Equinox: "linear-gradient(160deg, #F1DFB4 0%, #8D7AB0 50%, #13132E 100%)"
};
