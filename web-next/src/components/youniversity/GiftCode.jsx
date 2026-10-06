import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getArcanum } from "../../constants/arcana";

const FIELD = "flex-1 min-w-0 bg-surface1 border border-borderC rounded-sm px-3.5 py-2.5 text-body text-textPrimary uppercase tracking-wide outline-none focus:border-forestAccent shadow-field placeholder:normal-case placeholder:tracking-normal";

// "Have a gift code?": unlocks a paid Arcanum for free. The server checks
// the code and grants it; this only sends what was typed.
export default function GiftCode({ startOpen = false }) {
  const navigate = useNavigate();
  const { redeemArcanumCode } = useAppData();
  const [open, setOpen] = useState(startOpen);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  async function redeem(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const slug = await redeemArcanumCode(code);
      setDone(getArcanum(slug));
      setCode("");
    } catch (err) {
      console.error("[GiftCode] redeem failed:", err);
      setError(err.friendly || "That code couldn't be used. Check it and try again.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div role="status" className="rounded-card bg-surface1 border border-borderC p-4 text-center">
        <Gift size={22} strokeWidth={1.75} className="text-gold mx-auto mb-2" />
        <div className="font-serif text-h2 text-textPrimary">{done?.name || "Your Arcanum"} is yours</div>
        <div className="text-bodySm text-textSecondary mt-1 mb-3">A gift, kept in your Library.</div>
        {done && (
          <button onClick={() => navigate(`/youniversity/arcanum/${done.slug}`)} className="min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium text-body">
            Open it
          </button>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary underline underline-offset-4 decoration-borderC hover:text-textPrimary">
        <Gift size={15} strokeWidth={1.75} /> Have a gift code?
      </button>
    );
  }

  return (
    <form onSubmit={redeem} className="w-full">
      <label htmlFor="gift-code" className="block text-bodySm text-textPrimary font-medium mb-1.5">Your gift code</label>
      <div className="flex gap-2">
        <input
          id="gift-code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          placeholder="e.g. EMPATH-1A2B3C"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          className={FIELD}
        />
        <button type="submit" disabled={busy || !code.trim()} className="flex-none min-h-[44px] px-4 rounded-sm bg-forestAccent text-onAccent font-medium text-bodySm disabled:opacity-50">
          {busy ? "Checking…" : "Redeem"}
        </button>
      </div>
      {error && <div role="alert" className="text-bodySm text-red-500 mt-2">{error}</div>}
    </form>
  );
}
