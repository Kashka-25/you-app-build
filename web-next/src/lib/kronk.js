import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// YOU ↔ Kronk (kronk.info). Everything goes through the `kronk` Edge
// Function (supabase/functions/kronk), which holds the Kronk login; the app
// only ever sees the Seeker's handle and plain-text posts.
export const KRONK_URL = "https://kronk.info";
export const KRONK_YOU_HUB = "https://kronk.info/hub/you";
// Where the redirect lands; App renders KronkCallback here, signed in or not.
export const KRONK_CALLBACK_PATH = "/kronk/callback";

async function call(body) {
  const { data, error } = await supabase.functions.invoke("kronk", { body });
  if (error) {
    let payload = {};
    try { payload = await error.context.json(); } catch { /* not JSON */ }
    const e = new Error(payload.error || "Couldn't reach Kronk just now. Try again in a moment.");
    e.code = payload.code;
    throw e;
  }
  return data;
}

// Sends the browser to Kronk to approve YOU. mode "link" connects the
// signed-in Seeker; "signin" is "Continue with Kronk" from the sign-in screen.
export async function goToKronk(mode, returnTo = "/community") {
  try { sessionStorage.setItem("you.kronk.return", returnTo); } catch { /* fine without */ }
  const { url } = await call({ action: "start", mode, origin: window.location.origin });
  window.location.assign(url);
}

export function takeReturnPath() {
  try {
    const p = sessionStorage.getItem("you.kronk.return");
    sessionStorage.removeItem("you.kronk.return");
    return p && p.startsWith("/") ? p : "/community";
  } catch { return "/community"; }
}

export const finishKronk = (code, state) => call({ action: "finish", code, state });
export const disconnectKronk = () => call({ action: "disconnect" });
export const kronkTimeline = (feed, { limit, maxId } = {}) => call({ action: "timeline", feed, limit, max_id: maxId });
export const KRONK_HOME = "https://kronk.info/home";
// Kronk's own "What's on your mind?" box.
export const KRONK_PUBLISH = "https://kronk.info/publish";
export const postToKronk = (text, visibility) => call({ action: "post", text, visibility });

// The Seeker's Kronk link (without the token, which the database never
// gives out). `null` = not connected; `undefined` = still checking.
const listeners = new Set();
export function refreshKronkLink() { listeners.forEach(fn => fn()); }

export function useKronkLink() {
  const { userId, isDevMode } = useAuth();
  const [link, setLink] = useState(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  useEffect(() => {
    if (!userId || isDevMode) { setLink(null); return; }
    let live = true;
    supabase.from("kronk_links").select("handle,display_name,avatar_url,profile_url,created_at").eq("user_id", userId).maybeSingle()
      .then(({ data, error }) => {
        if (!live) return;
        if (error) console.error("[kronk] link read failed:", error);
        setLink(data || null);
      });
    return () => { live = false; };
  }, [userId, isDevMode, tick]);

  return link;
}

// Kronk-only Seekers have a placeholder email and sign in with Kronk.
export function signsInWithKronk(email) {
  return typeof email === "string" && email.endsWith("@kronk-login.invalid");
}
