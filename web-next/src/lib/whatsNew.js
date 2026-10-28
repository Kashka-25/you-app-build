import { useAuth } from "./AuthContext";

// What's new in YOU, newest first (Cassidy, Oct 27: "a tour page that hints
// at the new features as we add them"). Add an entry here when something
// new goes live; the side menu shows a dot until each Seeker has seen it.
// `plugin` entries can be switched on right from the card; `to` entries
// take the Seeker there.
export const WHATS_NEW = [
  {
    id: "2026-10-28b-seasons",
    date: "2026-10-28",
    title: "Season reviews and Look back",
    body: "When the year turns at a solstice or equinox, YOU invites you to look back on the season just ended: what you lived, how you felt, what grew, and YOU's reading of it. The equinoxes look back six months, at light and shadow. Any time, Look back over the last two weeks, a month, or since a date.",
    to: "/season-review",
    open: "See your latest review"
  },
  {
    id: "2026-10-28a-streaks",
    date: "2026-10-28",
    title: "Streaks and steps earn more",
    body: "Every 7 days in a row on a habit adds a +5 XP bonus, and every 30 days in a row another +10. A habit with steps shares its XP between them, so each tick counts.",
    to: "/",
    open: "See your habits"
  },
  {
    id: "2026-10-28-yourigin",
    date: "2026-10-28",
    title: "YOUrigin, for creators",
    body: "Make art or write? Switch on YOUrigin to share pieces from YOU's sister app into Showcase, and see here whether each one is waiting, live or not this time.",
    plugin: "yourigin",
    icon: "yourigin",
    to: "/yourigin",
    open: "Open YOUrigin"
  },
  {
    id: "2026-10-28-dreams",
    date: "2026-10-28",
    title: "Patterns across your dreams",
    body: "Tap #dream in your YOUrnal and ask for a reading across every dream you've recorded: the symbols and feelings that keep returning, and how they've shifted. Value challenges can now fit your own life too, from what you let AI read.",
    to: "/reflections",
    open: "Open YOUrnal"
  },
  {
    id: "2026-10-27c-pursyouts", // sorts after the 27th's earlier entries
    date: "2026-10-27",
    title: "PursYOUts, closer to hand",
    body: "Everything you're growing now has a name and an emblem: PursYOUts. Find it on Home under your journey, in the side menu, or put it on your bottom bar in Extras. Completed ones fold away inside each Pillar. Also new: today's tasks and habits sit right by the welcome, the Tree of YOU opens full screen, and the Cosmos stars drift.",
    icon: "pursuits",
    to: "/pursue",
    open: "Open PursYOUts"
  },
  {
    id: "2026-10-27b-extras", // sorts after the 27th's first entry, so the dot comes back
    date: "2026-10-27",
    title: "Make YOU yours with Extras",
    body: "Open Extras in the side menu to choose what you see. Hide places you don't use from the side menu, and pick the two places either side of Add on your bottom bar. Home and YOU always stay, and new extras like YOUr Projects are switched on there too.",
    to: "/extras",
    open: "Open Extras"
  },
  {
    id: "2026-10-27-projects",
    date: "2026-10-27",
    title: "YOUr Projects",
    body: "A space of its own for the things you're making: a book, a garden, a move. Each project keeps its notes and to-dos as New, Doing or Done. Tag a YOUrnal entry with a project's name and it lands there too.",
    plugin: "projects",
    icon: "projects",
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
