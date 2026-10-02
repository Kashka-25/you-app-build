import { useEffect, useState } from "react";
import { LogOut, Sparkles, Sun } from "lucide-react";
import { thresholdOnOpen, setThresholdOnOpen } from "../../lib/week";
import { AI_USER_MONTHLY_USD } from "../../lib/aiCost";
import { useAuth } from "../../lib/AuthContext";
import { useAppData } from "../../lib/AppDataContext";
import { BackRow, SectionTitle, Placeholder } from "../Primitives";
import { FloatingLabelField } from "../ui/Input";
import { Button } from "../ui/Button";

// "My YOU" — the personal identity screen (MVP Feature 1). Account-level
// bits (sign out) live here too since there's no separate Settings screen
// yet, not because they belong to the same concept long-term.
export default function Settings() {
  const { signOut } = useAuth();
  const { profile, saveProfile, loaded, aiConsent, setAiConsentGranted } = useAppData();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    setName(profile?.name || "");
    setBio(profile?.bio || "");
    setLocation(profile?.location || "");
  }, [loaded, profile]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveProfile({ name: name.trim(), bio: bio.trim(), location: location.trim() });
      setSavedAt(Date.now());
    } catch (err) {
      console.error("[Settings] profile save failed:", err);
      setError(
        err?.code === "PGRST116"
          ? "No profile row exists yet for your account — run the profile-identity migration, then reload."
          : "Couldn't save your profile — check your connection and try again."
      );
    }
    setSaving(false);
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Your Own Universe</SectionTitle>
      <div className="text-bodySm text-textSecondary -mt-2 mb-4">Who you are, in your own words.</div>

      {!loaded ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : (
        <form onSubmit={submit}>
          <FloatingLabelField
            label="Name"
            className="mb-3"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <FloatingLabelField
            label="Current location"
            className="mb-3"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <label className="block text-label uppercase text-textMuted mb-1.5">About you</label>
          <textarea
            rows={4}
            className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 mb-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field"
            placeholder="Whatever feels true right now — values, context, what matters to you."
            value={bio}
            onChange={e => setBio(e.target.value)}
          />

          {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
          {savedAt && !error && <div className="text-bodySm text-sage mb-3">Saved.</div>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      )}

      <AiReflectionsSetting aiConsent={aiConsent} onChange={setAiConsentGranted} />
      <ThresholdSetting />

      <div className="mt-6">
        <Placeholder label="preferences">Notifications, privacy, data export — future.</Placeholder>
      </div>

      <Button variant="secondary" icon={LogOut} onClick={() => signOut()} className="w-full mt-2">
        Sign out
      </Button>
    </div>
  );
}

// Revocable any time. Turning it off takes effect immediately: the app stops
// asking Claude, and the Edge Functions refuse without a current yes.
function AiReflectionsSetting({ aiConsent, onChange }) {
  const { aiUsageThisMonth } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState(null);
  const on = Boolean(aiConsent?.granted);

  // The beta allowance, so a limit is never a surprise.
  useEffect(() => {
    aiUsageThisMonth().then(setUsage).catch(e => console.error("[Settings] usage read failed:", e));
  }, []);

  async function toggle() {
    setSaving(true);
    setError("");
    try {
      await onChange(!on);
    } catch (e) {
      console.error("[Settings] AI consent change failed:", e);
      setError("Couldn't change that — check your connection and try again.");
    }
    setSaving(false);
  }

  const since = on && aiConsent.granted_at
    ? new Date(aiConsent.granted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="mt-6 rounded-card bg-surface1 shadow-card p-4">
      <div className="flex items-center gap-2 text-label uppercase text-gold mb-2">
        <Sparkles size={13} strokeWidth={1.75} />
        AI reflections
      </div>
      <div className="text-bodySm text-textSecondary mb-3">
        {on
          ? `On${since ? ` since ${since}` : ""}. When you ask for a reflection, the words you chose are sent to Claude (by Anthropic) only to write it.`
          : "Off. Nothing you write is sent to an AI. You'll be asked before it ever is."}
      </div>
      {usage && (
        <div className="mb-3">
          <div className="flex justify-between text-caption text-textSecondary mb-1">
            <span>Beta allowance this month</span>
            <span>
              {usage.usd >= AI_USER_MONTHLY_USD
                ? "Used up for this month"
                : `$${usage.usd.toFixed(2)} of $${AI_USER_MONTHLY_USD.toFixed(2)}`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface3 overflow-hidden">
            <div className="h-full bg-forestAccent" style={{ width: `${Math.min(100, (usage.usd / AI_USER_MONTHLY_USD) * 100)}%` }} />
          </div>
          <div className="text-caption text-textMuted mt-1">Resets on the 1st. When it's used up, AI reflections rest; everything else keeps working.</div>
        </div>
      )}
      {error && <div className="text-bodySm text-red-500 mb-2">{error}</div>}
      <Button variant="secondary" size="sm" disabled={saving || aiConsent === null} onClick={toggle}>
        {saving ? "Saving…" : on ? "Turn off AI reflections" : "Turn on AI reflections"}
      </Button>
    </div>
  );
}

// Escape hatch for the Threshold. Per device for now (localStorage), so it
// needs no migration; move to the profile if it should follow the Seeker.
function ThresholdSetting() {
  const [on, setOn] = useState(thresholdOnOpen);

  function toggle() {
    setThresholdOnOpen(!on);
    setOn(!on);
  }

  return (
    <div className="mt-4 rounded-card bg-surface1 shadow-card p-4">
      <div className="flex items-center gap-2 text-label uppercase text-gold mb-2">
        <Sun size={13} strokeWidth={1.75} />
        Open on the Threshold
      </div>
      <div className="text-bodySm text-textSecondary mb-3">
        {on
          ? "On. When you open YOU, you'll land on today first, with a portal into the rest."
          : "Off. YOU opens straight to Home. The Threshold is still a tap away from the Today card."}
      </div>
      <Button variant="secondary" size="sm" onClick={toggle}>
        {on ? "Open straight to Home" : "Open on the Threshold"}
      </Button>
    </div>
  );
}
