import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Same DEV_MODE pattern as the vanilla app: "bypass" for local dev,
// "live" for real Supabase auth. Switch to "live" before this branch
// goes anywhere near production.
const DEV_MODE = "bypass";
const DEV_USER_ID = "dev-local-user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(DEV_MODE !== "bypass");

  useEffect(() => {
    if (DEV_MODE === "bypass") return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = DEV_MODE === "bypass" ? DEV_USER_ID : session?.user?.id ?? null;

  const value = {
    userId,
    loading,
    isDevMode: DEV_MODE === "bypass",
    signInWithPassword: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
