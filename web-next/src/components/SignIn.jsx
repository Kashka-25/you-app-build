import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

const fieldClass =
  "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent";
const labelClass = "text-label uppercase text-textMuted";

export default function SignIn() {
  const { signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
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
    <div className="min-h-dvh bg-black flex justify-center items-center sm:py-8 sm:px-3 font-sans">
      <div className="w-full h-dvh sm:h-auto sm:w-[390px] bg-bg sm:border sm:border-borderC sm:rounded-[40px] overflow-hidden p-8 flex flex-col justify-center">
        <div className="font-serif text-h1 text-textPrimary mb-1">YOU</div>
        <div className="text-bodySm text-textSecondary mb-6">
          {mode === "signin" ? "Welcome back." : "Create your account."}
        </div>

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

          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={fieldClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
          {info && <div className="text-bodySm text-sage mb-3">{info}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-forestAccent text-surface2 rounded-sm py-3 font-medium disabled:opacity-40"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="w-full text-center text-bodySm text-textSecondary mt-4"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setInfo("");
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
