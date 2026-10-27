import { useAuth } from "./AuthContext";
import { usePlugin } from "./plugins";

// The places in YOU, and each Seeker's own choice of which show in the side
// menu and the bottom bar (Cassidy, Oct 27). Home and YOU are always there;
// the bar's two middle spots default to YOUrney and YOUrnal and can hold
// any place that has an emblem. Kept per account (prefs.nav), so it
// follows them to every device.
//
// Journey-before-KommYOUnity is deliberate: the app is about the individual
// first, community second. Don't reorder.
export const PLACES = [
  { key: "home", to: "/", end: true, label: "Home", icon: "home", locked: true },
  { key: "yourney", to: "/journey", label: "YOUrney", icon: "yourney" },
  { key: "yournal", to: "/reflections", label: "YOUrnal", icon: "reflections" },
  // "PursYOUts" is a trial name (Cassidy, Oct 27); the page is /pursue.
  { key: "pursuits", to: "/pursue", label: "PursYOUts", icon: "pursuits" },
  { key: "youniversity", to: "/youniversity", label: "YOUniversity", icon: "youniversity" },
  { key: "community", to: "/community", label: "KommYOUnity", icon: "community" },
  { key: "you", to: "/you", label: "YOU", icon: "you", locked: true },
  { key: "projects", to: "/projects", label: "YOUr Projects", icon: "projects", plugin: "projects" },
  { key: "showcase", to: "/showcase", label: "Showcase", icon: "showcase" }
];

export const DEFAULT_BAR = ["yourney", "yournal"];

export function useNavigation() {
  const { prefs, setPrefs } = useAuth();
  const projectsOn = usePlugin("projects");
  const nav = prefs?.nav || {};
  const hidden = new Set(nav.hidden || []);

  // A place belonging to an extra only exists while that extra is on.
  const available = PLACES.filter(p => !p.plugin || (p.plugin === "projects" && projectsOn));
  const byKey = key => available.find(p => p.key === key);

  const menu = available.filter(p => p.locked || !hidden.has(p.key));

  // The two middle spots: the Seeker's picks if they still exist and differ,
  // otherwise the defaults.
  const picks = Array.isArray(nav.bar) ? nav.bar : DEFAULT_BAR;
  const bar = [0, 1].map(i => {
    const key = picks[i];
    const other = picks[1 - i];
    const place = byKey(key);
    return place && !place.locked && key !== other ? place : byKey(DEFAULT_BAR[i]);
  });

  const save = patch => setPrefs({ nav: { ...nav, ...patch } });

  return {
    available,
    menu,
    bar,
    isHidden: key => hidden.has(key),
    setShown: (key, shown) => {
      const next = new Set(hidden);
      if (shown) next.delete(key); else next.add(key);
      return save({ hidden: [...next] });
    },
    // Choosing a place already in the other spot swaps the two.
    setBarSpot: (i, key) => {
      const current = bar.map(p => p.key);
      const next = [...current];
      const j = current.indexOf(key);
      if (j !== -1 && j !== i) next[j] = current[i];
      next[i] = key;
      return save({ bar: next });
    },
    isDefault: !nav.hidden?.length && (!nav.bar || (nav.bar[0] === DEFAULT_BAR[0] && nav.bar[1] === DEFAULT_BAR[1])),
    reset: () => setPrefs({ nav: {} })
  };
}
