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
    on: true
  },
  {
    key: "projects",
    title: "YOUr Projects",
    icon: "projects",
    desc: "A space of its own for the things you're making: a book, a garden, a move. Each project keeps its notes and to-dos as New, Doing or Done. Opens from the side menu.",
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
