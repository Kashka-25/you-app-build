import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

const fieldClass =
  "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent shadow-field";
const labelClass = "text-label uppercase text-textMuted";
// Matches Supabase Auth's minimum (set Oct 2), so the form says it first.
export const MIN_PASSWORD = 12;

// The card every signed-out screen sits in.
export function AuthCard({ children }) {
  return (
    <div className="min-h-dvh bg-black flex justify-center items-center sm:py-8 sm:px-3 font-sans">
      <div className="w-full min-h-dvh sm:min-h-0 sm:w-[390px] bg-bg sm:border sm:border-borderC sm:rounded-[40px] overflow-hidden p-8 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

const HEADINGS = {
  signin: "Welcome back.",
  signup: "Create your account.",
  reset: "Forgotten your password? We'll email you a link to set a new one."
};

export default function SignIn() {
  const { signInWithPassword, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function go(next) {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    if (mode === "reset") {
      const { error: err } = await sendPasswordReset(email.trim());
      setBusy(false);
      // Same message whether or not the address has an account, so the form
      // can't be used to find out who uses YOU.
      if (err && err.status !== 400) setError("Couldn't send the email just now. Try again in a minute.");
      else setInfo("If that email has a YOU account, a link is on its way. It can take a few minutes; check your spam folder too.");
      return;
    }
    const action = mode === "signin" ? signInWithPassword : signUp;
    const { error: err } = await action(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (mode === "signup") {
      setInfo("Account created. If email confirmation is on, check your inbox — otherwise you're signed in now.");
    }
  }

  return (
    <AuthCard>
      <div className="font-serif text-h1 text-textPrimary mb-1 flex items-center gap-2.5">
        YOU <BetaBadge />
      </div>
      <div className="text-bodySm text-textSecondary mb-6">{HEADINGS[mode]}</div>

      <form onSubmit={submit}>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {mode !== "reset" && (
          <>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              minLength={mode === "signup" ? MIN_PASSWORD : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={fieldClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {mode === "signup" && (
              <div className="text-caption text-textMuted -mt-1.5 mb-3">At least {MIN_PASSWORD} characters.</div>
            )}
          </>
        )}

        {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
        {info && <div className="text-bodySm text-sage mb-3">{info}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-forestAccent text-onAccent rounded-sm py-3 font-medium disabled:opacity-40"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send me a link"}
        </button>
      </form>

      {mode === "signin" && (
        <button type="button" className="w-full text-center text-bodySm text-textSecondary mt-4" onClick={() => go("reset")}>
          Forgot your password?
        </button>
      )}
      <button
        type="button"
        className="w-full text-center text-bodySm text-textSecondary mt-3"
        onClick={() => go(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "New here? Create an account" : mode === "signup" ? "Already have an account? Sign in" : "Back to sign in"}
      </button>

      {mode === "signup" && (
        <div className="text-caption text-textMuted text-center mt-5">
          By creating an account you agree to the{" "}
          <a href="/privacy" className="underline underline-offset-2">beta terms and privacy note</a>.
        </div>
      )}
      {mode !== "signup" && (
        <a href="/privacy" className="block text-center text-caption text-textMuted mt-5 underline underline-offset-2">
          Privacy &amp; beta terms
        </a>
      )}
    </AuthCard>
  );
}

// Shown once the reset link has signed the Seeker in.
export function SetNewPassword() {
  const { setNewPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password !== again) {
      setError("Those two don't match yet.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await setNewPassword(password);
    setBusy(false);
    if (err) setError(err.message);
  }

  return (
    <AuthCard>
      <div className="font-serif text-h1 text-textPrimary mb-1">A new password</div>
      <div className="text-bodySm text-textSecondary mb-6">Choose one you'll remember. At least {MIN_PASSWORD} characters.</div>
      <form onSubmit={submit}>
        <label className={labelClass}>New password</label>
        <input type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={fieldClass} value={password} onChange={e => setPassword(e.target.value)} />
        <label className={labelClass}>Once more</label>
        <input type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={fieldClass} value={again} onChange={e => setAgain(e.target.value)} />
        {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
        <button type="submit" disabled={busy} className="w-full bg-forestAccent text-onAccent rounded-sm py-3 font-medium disabled:opacity-40">
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </AuthCard>
  );
}

// A small, quiet marker that YOU is still being built.
export function BetaBadge({ className = "" }) {
  return (
    <span className={`font-sans text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--gold)_50%,transparent)] text-gold align-middle ${className}`}>
      Beta
    </span>
  );
}
