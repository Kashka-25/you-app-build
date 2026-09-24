import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
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
  const { profile, saveProfile, loaded } = useAppData();

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
      <SectionTitle>My YOU</SectionTitle>
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

      <div className="mt-6">
        <Placeholder label="preferences">Notifications, privacy, data export — future.</Placeholder>
      </div>

      <Button variant="secondary" icon={LogOut} onClick={() => signOut()} className="w-full mt-2">
        Sign out
      </Button>
    </div>
  );
}
