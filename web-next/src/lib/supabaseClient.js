import { createClient } from "@supabase/supabase-js";

// Same Supabase project as the live vanilla app (js/config.js).
// TODO (carried over from existing repo backlog): move these into
// import.meta.env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) before
// this branch replaces the production build. Anon key + RLS is safe
// to ship client-side; this is just tidiness, not a security fix.
const SUPABASE_URL = "https://yikoymzktspamahrsuje.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpa295bXprdHNwYW1haHJzdWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Njc4OTIsImV4cCI6MjA5NjE0Mzg5Mn0.tCjIeCz7PtJ5DeLHsKk974qB7KbaflQ_XAAJk7z7tfw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
