import { useAuth } from "./AuthContext";

// Optional parts of YOU each Seeker can switch on or off in Your Own
// Universe. Kept per account (auth prefs). `on` is the default for anyone
// who hasn't chosen, so existing Seekers keep what they had.
// `icon`: every extra has its own emblem in the YOU art style (Cassidy,
// Oct 27), in public/images/icons as <name>.png (128px) and <name>@4x.png.
// See design/plugin-emblems for how they're drawn.
export const PLUGINS = [
  {
    key: "todo_list",
    title: "Today's to-do list",
    icon: "todo",
    desc: "A quick list for small things today, on Home and the Threshold. Whatever's left tonight falls away.",
    summary: "A light list for the small things you want to do today.",
    more: [
      "It sits in Today on Home and on the Threshold. Type a thing, tick it off, and break it into steps if it helps.",
      "It's for small, one-off things that aren't part of what you're growing: no Pillars, no XP, no streaks.",
      "Whatever's left at night falls away, so nothing piles up as overdue. Tomorrow starts clear."
    ],
    on: true
  },
  {
    key: "projects",
    title: "YOUr Projects",
    icon: "projects",
    summary: "A space for the things you're making, each with its own to-do list.",
    more: [
      "Make a project for anything with its own running list: a book, a garden, a business, a move overseas.",
      "Each one keeps notes and to-dos as New, Doing or Done, with search, so nothing gets lost.",
      "Tag a YOUrnal entry with a project's name (for My Book, #MyBook) and it files itself into that project.",
      "It opens as its own calm space from the side menu, and works offline like the rest of YOU."
    ],
    desc: "A space of its own for the things you're making: a book, a garden, a move. Each project keeps its notes and to-dos as New, Doing or Done. Opens from the side menu.",
    on: false
  },
  {
    key: "yourigin",
    title: "YOUrigin",
    icon: "yourigin",
    summary: "For creators: share your art and words from YOUrigin into YOU's Showcase.",
    more: [
      "YOUrigin is YOU's sister app for creators. Sign in there with this same account and your artist profile is shared between the two.",
      "From any piece in YOUrigin, tap Share to YOU and choose words or an image, where it may appear (Home background, Featured words or the Gallery), and an optional ask for support.",
      "Every piece is looked at before it goes live. This page shows where each of yours stands: waiting, live or not this time.",
      "Edit a piece in YOUrigin and it waits for a fresh look. Manage everything you've shared under YOUrigin's Shared."
    ],
    desc: "For creators: share your art and words from YOUrigin into Showcase, and see where each piece stands. Opens from the side menu.",
    on: false
  }
];

// Settings that live with the screen they change, not extras (Cassidy,
// Oct 27: the endless feed "is less of a plugin and more of an option").
// Kept in the same prefs, so nobody's choice changes.
export const OPTIONS = [
  {
    key: "endless_feed",
    title: "Endless KommYOUnity feed",
    desc: "Your mates' posts keep loading as you scroll. Off, the feed pauses every 15 posts until you tap Show more.",
    on: true
  }
];

export function usePlugin(key) {
  const { prefs } = useAuth();
  const plugin = [...PLUGINS, ...OPTIONS].find(p => p.key === key);
  return prefs?.plugins?.[key] ?? plugin?.on ?? true;
}

// Every extra with whether it's on, for lists (the side menu's Hidden fold).
export function usePluginStates() {
  const { prefs } = useAuth();
  return PLUGINS.map(p => ({ ...p, isOn: prefs?.plugins?.[p.key] ?? p.on }));
}

export function useSetPlugin() {
  const { prefs, setPrefs } = useAuth();
  return (key, on) => setPrefs({ plugins: { ...(prefs?.plugins || {}), [key]: on } });
}
