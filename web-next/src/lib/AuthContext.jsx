import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { clearOfflineData, pendingCount, syncQueue } from "./offline";

// Same DEV_MODE pattern as the vanilla app: "bypass" for local dev,
// "live" for real Supabase auth. Switched to "live" so real per-user data
// (Journey timeline moments, etc.) actually persists under RLS instead of
// writing as a fake user id that owns no real rows.
const DEV_MODE = "live";
const DEV_USER_ID = "dev-local-user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(DEV_MODE !== "bypass");
  // True after arriving from a "reset your password" email: the link signs
  // the Seeker in, and App asks for a new password before anything else.
  const [recovering, setRecovering] = useState(false);
  // Bypass mode has no real user to keep preferences on.
  const [localPrefs, setLocalPrefs] = useState({});

  useEffect(() => {
    if (DEV_MODE === "bypass") return;

    // Opened with no signal after the hour-long sign-in token ran out:
    // renewing it needs the internet, so the library reports no session.
    // Carry on as the account last signed in on this device (its data is
    // kept here, see lib/offline.js) until the signal returns.
    function lastKnownSession() {
      try {
        const key = Object.keys(localStorage).find(k => /^sb-.*-auth-token$/.test(k));
        const s = key && JSON.parse(localStorage.getItem(key));
        return s?.user && s?.refresh_token ? s : null;
      } catch { return null; }
    }
    function restore() {
      return supabase.auth.getSession().then(({ data, error }) => {
        if (data.session) setSession(data.session);
        else if (error && !navigator.onLine) setSession(lastKnownSession());
        else setSession(null);
        setLoading(false);
      });
    }
    restore();
    // Back online: renew the token for real, then send anything waiting.
    const onOnline = () => restore().then(() => syncQueue());
    window.addEventListener("online", onOnline);

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("online", onOnline); };
  }, []);

  const userId = DEV_MODE === "bypass" ? DEV_USER_ID : session?.user?.id ?? null;

  // Small per-account choices (which plugins are on, first-run done), kept in
  // the auth user's metadata so they follow the Seeker to any device with no
  // migration. Only ever preferences: nothing private or trusted goes here,
  // since the Seeker can edit their own metadata.
  const prefs = DEV_MODE === "bypass" ? localPrefs : session?.user?.user_metadata?.prefs || {};
  async function setPrefs(patch) {
    const next = { ...prefs, ...patch };
    if (DEV_MODE === "bypass") { setLocalPrefs(next); return; }
    const { data, error } = await supabase.auth.updateUser({ data: { prefs: next } });
    if (error) throw error;
    if (data?.user) setSession(s => (s ? { ...s, user: data.user } : s));
  }

  const value = {
    prefs,
    setPrefs,
    userId,
    loading,
    isDevMode: DEV_MODE === "bypass",
    signInWithPassword: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    // A fresh confirmation link, for when the first one went to Junk or expired.
    resendConfirmation: email => supabase.auth.resend({ type: "signup", email }),
    // Nothing personal stays on the device after signing out, but changes
    // still waiting to sync are only lost if the Seeker says so.
    signOut: async () => {
      if (await pendingCount()) {
        await syncQueue();
        const left = await pendingCount();
        if (left && !window.confirm(`${left} change${left === 1 ? " hasn't" : "s haven't"} synced yet (no connection). Sign out anyway and lose ${left === 1 ? "it" : "them"}?`)) return;
      }
      await clearOfflineData();
      return supabase.auth.signOut();
    },
    recovering,
    // The link comes back to this site's root (it must be listed under Auth
    // → URL Configuration → Redirect URLs in Supabase).
    sendPasswordReset: email =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/" }),
    setNewPassword: async password => {
      const res = await supabase.auth.updateUser({ password });
      if (!res.error) setRecovering(false);
      return res;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
