import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
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
    signOut: () => supabase.auth.signOut(),
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
