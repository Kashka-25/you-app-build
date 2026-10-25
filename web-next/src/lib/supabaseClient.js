import { createClient } from "@supabase/supabase-js";
import { offlineFetch, setTokenSource } from "./offline";

// Same Supabase project as the live vanilla app (js/config.js).
// Values come from .env (gitignored) — see .env.example for the keys
// this project needs. Anon key + RLS is safe to ship client-side either
// way; this is about not hardcoding config into source, not a security fix.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill them in."
  );
}

// Its fetch is offline-aware (lib/offline.js): reads are kept on the device
// and writes queue up when there's no signal.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { fetch: offlineFetch } });

// The queue is sent with a fresh token, never the one it was made with.
setTokenSource(async () => (await supabase.auth.getSession()).data.session?.access_token || null);
