import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthCard } from "./SignIn";
import { LoadingScreen } from "./ui/LoadingScreen";

// Where every account email lands: /auth/confirm?token_hash=…&type=…
// (Oct 25). The emails used to link straight to the Supabase address,
// which doesn't match hello@yourownuniverse.life, so Outlook and Hotmail
// hid them as likely phishing. Now the link is on our own domain and YOU
// checks the token here. The email templates live in Supabase → Auth →
// Emails; copies are in supabase/email-templates.
const TYPES = ["signup", "recovery", "invite", "magiclink", "email_change", "email"];

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; a token works once
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    if (!token_hash || !TYPES.includes(type)) {
      setError("This link is missing a part. Try opening it from the email again.");
      return;
    }
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error: err }) => {
      if (err) {
        console.error("[ConfirmEmail]", err);
        setError("This link has expired or has already been used. Sign in, or ask for a new link.");
        return;
      }
      // A reset link signs them in and App asks for the new password.
      navigate("/", { replace: true });
    });
  }, []);

  if (!error) {
    return (
      <div className="min-h-dvh bg-bg flex justify-center items-center font-sans">
        <LoadingScreen label="Confirming" />
      </div>
    );
  }
  return (
    <AuthCard>
      <div className="font-serif text-h1 text-textPrimary mb-2">That link didn't work</div>
      <div className="text-bodySm text-textSecondary mb-6">{error}</div>
      <button
        type="button"
        onClick={() => navigate("/", { replace: true })}
        className="w-full bg-forestAccent text-onAccent rounded-sm py-3 font-medium"
      >
        Go to sign in
      </button>
    </AuthCard>
  );
}
