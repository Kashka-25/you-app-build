import { useAuth } from "./AuthContext";

// Optional parts of YOU each Seeker can switch on or off in Your Own
// Universe. Kept per account (auth prefs). `on` is the default for anyone
// who hasn't chosen, so existing Seekers keep what they had.
export const PLUGINS = [
  {
    key: "todo_list",
    title: "Today's to-do list",
    desc: "A quick list for small things today, on Home and the Threshold. Whatever's left tonight falls away.",
    on: true
  },
  {
    key: "projects",
    title: "YOUr Projects",
    desc: "A space of its own for the things you're making: a book, a garden, a move. Each project keeps its notes and to-dos as New, Doing or Done. Opens from the side menu.",
    on: false
  },
  {
    key: "endless_feed",
    title: "Endless KommYOUnity feed",
    desc: "Your mates' posts keep loading as you scroll. Off, the feed pauses every 15 posts until you tap Show more.",
    on: true
  }
];

export function usePlugin(key) {
  const { prefs } = useAuth();
  const plugin = PLUGINS.find(p => p.key === key);
  return prefs?.plugins?.[key] ?? plugin?.on ?? true;
}

export function useSetPlugin() {
  const { prefs, setPrefs } = useAuth();
  return (key, on) => setPrefs({ plugins: { ...(prefs?.plugins || {}), [key]: on } });
}
