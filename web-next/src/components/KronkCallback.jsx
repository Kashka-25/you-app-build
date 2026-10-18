import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { finishKronk, refreshKronkLink, takeReturnPath } from "../lib/kronk";
import { AuthCard } from "./SignIn";

// Kronk sends the browser back here after the Seeker approves (or declines)
// YOU. Works signed in (connecting) and signed out (Continue with Kronk).
// A full page load afterwards, so the app starts fresh with the new session.
export default function KronkCallback() {
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode runs effects twice; a code works once
    ran.current = true;
    const q = new URLSearchParams(window.location.search);
    const code = q.get("code");
    const state = q.get("state");
    if (q.get("error") || !code || !state) {
      setError(q.get("error") === "access_denied" ? "No problem. YOU wasn't connected to Kronk." : "That Kronk link didn't come back complete. Please try again.");
      return;
    }
    (async () => {
      try {
        const res = await finishKronk(code, state);
        if (res.token_hash) {
          const { error: err } = await supabase.auth.verifyOtp({ token_hash: res.token_hash, type: "magiclink" });
          if (err) throw new Error("Kronk said yes, but YOU couldn't sign you in. Please try again.");
        }
        refreshKronkLink();
        window.location.replace(takeReturnPath());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <AuthCard>
      <div className="font-serif text-h1 text-textPrimary mb-2">{error ? "Not connected" : "Connecting to Kronk…"}</div>
      <p className="text-bodySm text-textSecondary mb-6">
        {error || "Just a moment while Kronk and YOU say hello."}
      </p>
      {error && (
        <a href="/" className="w-full text-center bg-forestAccent text-onAccent rounded-sm py-3 font-medium">Back to YOU</a>
      )}
    </AuthCard>
  );
}
