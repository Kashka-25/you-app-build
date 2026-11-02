import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useAppData } from "./AppDataContext";

// The simple beta (Cassidy, Nov 3, "K.I.S.S."): everyone starts on the core
// once, whatever they'd switched on before. Extras go back to off, and the
// side menu and bottom bar go back to the defaults (Home, YOUrnal, Add,
// PursYOUts, YOU). Cassidy (the admin) keeps YOUniversity on. Settings that
// aren't extras, like the endless KommYOUnity feed, are kept. Runs once per
// account, marked by prefs.simple_v1. Never on a local dev copy: that
// shares the live accounts, so testing there mustn't reset anyone.
export function useSimpleStart() {
  const { prefs, setPrefs } = useAuth();
  const { isAdmin, adminChecked } = useAppData();
  const done = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV || done.current || !adminChecked || prefs?.simple_v1) return;
    done.current = true;
    const kept = {};
    if (prefs?.plugins && "endless_feed" in prefs.plugins) kept.endless_feed = prefs.plugins.endless_feed;
    if (isAdmin) kept.youniversity = true;
    setPrefs({ simple_v1: true, plugins: kept, nav: {} })
      .catch(e => { done.current = false; console.error("[simpleStart] couldn't save:", e); });
  }, [adminChecked, isAdmin, prefs?.simple_v1]);
}
