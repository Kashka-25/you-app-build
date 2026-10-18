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
