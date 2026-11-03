import { useAuth } from "./AuthContext";

// Optional parts of YOU each Seeker can switch on or off in Settings →
// Extras. Kept per account (auth prefs). `on` is the default for anyone who
// hasn't chosen.
//
// The beta keeps YOU simple (Cassidy, Nov 3, "K.I.S.S."): the core is Home,
// YOUrnal, YOUrney, YOU and PursYOUts; everything else is an extra and
// starts switched off, so it's obvious how YOU is used. Testers turn on
// what they want, and we learn what people really use.
// `icon`: every extra has its own emblem in the YOU art style (Cassidy,
// Oct 27), in public/images/icons as <name>.png (128px) and <name>@4x.png.
// See design/plugin-emblems for how they're drawn.
export const PLUGINS = [
  {
    key: "youniversity",
    title: "YOUniversity",
    icon: "youniversity",
    summary: "Guided paths for real change, one small part at a time, and your own practices.",
    more: [
      "Walk a path like The Sovereign Empath, a part at a time, at your own pace.",
      "Each path unlocks practices you can come back to whenever you need them.",
      "With it on, Home shows the path you're walking and a practice for today."
    ],
    desc: "Guided paths and practices. Opens from the side menu, and shows your path and a practice for today on Home.",
    on: false
  },
  {
    key: "community",
    title: "KommYOUnity",
    icon: "community",
    summary: "YOU's community on Kronk: your mates, your orbit and the wider Kronkverse.",
    more: [
      "Sign in with your Kronk account (or connect it) and your Kronk feeds come into YOU.",
      "Froth and Komment on posts, and share moments from YOU when you choose to.",
      "Nothing from YOU is shared unless you share it."
    ],
    desc: "YOU's community, through your Kronk account. Opens from the side menu.",
    on: false
  },
  {
    key: "showcase",
    title: "Showcase",
    icon: "showcase",
    summary: "Art and words from YOUsers, featured on Home and gathered in a gallery.",
    more: [
      "A featured piece of writing or art greets you on Home, on the scroll.",
      "Browse the gallery, keep pieces in your collection and support the artists.",
      "Creators share their own work into Showcase with the YOUrigin extra."
    ],
    desc: "Featured art and words on Home, and the gallery. Opens from the side menu.",
    on: false
  },
  {
    key: "threshold",
    title: "The Threshold",
    icon: "home",
    summary: "Open YOU on a quiet threshold: a breath, then today's intention.",
    more: [
      "Each time you open YOU, you arrive on the Threshold first, once a visit.",
      "A moment to land before the day: your intention and what's due today.",
      "Off, YOU opens straight on Home."
    ],
    desc: "Open YOU on the Threshold before Home, once a visit.",
    on: false
  },
  {
    key: "focus",
    title: "Focus",
    icon: "focus",
    summary: "Timed sessions for one thing, fully, that tend what you're growing.",
    more: [
      "Start a session from the side menu, or tap the timer beside anything you've sown for today.",
      "A session for something you're growing counts as tending it, and each one plants a little in your week's garden on Harvest.",
      "Leave the screen and a small bar keeps time for you; YOU lets you know when it's done."
    ],
    desc: "Timed sessions for one thing, fully. Opens from the side menu, and from the timer beside what you've sown for today.",
    on: false
  },
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
    on: false
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
