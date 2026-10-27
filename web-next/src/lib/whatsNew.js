import { useAuth } from "./AuthContext";

// What's new in YOU, newest first (Cassidy, Oct 27: "a tour page that hints
// at the new features as we add them"). Add an entry here when something
// new goes live; the side menu shows a dot until each Seeker has seen it.
// `plugin` entries can be switched on right from the card; `to` entries
// take the Seeker there.
export const WHATS_NEW = [
  {
    id: "2026-10-27-projects",
    date: "2026-10-27",
    title: "YOUr Projects",
    body: "A space of its own for the things you're making: a book, a garden, a move. Each project keeps its notes and to-dos as New, Doing or Done. Tag a YOUrnal entry with a project's name and it lands there too.",
    plugin: "projects",
    to: "/projects",
    open: "Open YOUr Projects"
  },
  {
    id: "2026-10-25-offline",
    date: "2026-10-25",
    title: "YOU works offline",
    body: "No signal? YOU still opens, everything you've opened before is there, and what you write or tick is kept on your phone until you're back online.",
    to: null
  },
  {
    id: "2026-10-25-habits",
    date: "2026-10-25",
    title: "Your habits on Home",
    body: "Your daily habits now sit in Today on Home, ready to tick. Your YOUrnal shows your newest entries first, with tags you can search.",
    to: "/",
    open: "Go to Home"
  },
  {
    id: "2026-10-22-map",
    date: "2026-10-22",
    title: "Find your way",
    body: "A simple map of YOU: what each place is for, and four things to try first.",
    to: "/find-your-way",
    open: "Open the map"
  }
];

const LATEST = WHATS_NEW[0]?.id || "";

// True until this Seeker has opened What's new since the newest entry.
export function useWhatsNewUnseen() {
  const { prefs } = useAuth();
  return Boolean(LATEST) && (prefs?.whats_new_seen || "") < LATEST;
}

export function useMarkWhatsNewSeen() {
  const { prefs, setPrefs } = useAuth();
  return () => {
    if ((prefs?.whats_new_seen || "") >= LATEST) return;
    setPrefs({ whats_new_seen: LATEST }).catch(e => console.error("[whatsNew] couldn't remember:", e));
  };
}

export const latestNew = () => WHATS_NEW[0];
