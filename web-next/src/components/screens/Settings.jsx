import { useEffect, useRef, useState } from "react";
import { Brush, Download, LogOut, MapPin, Palette, PenLine, Puzzle, RotateCcw, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { SCALE_DEFAULT, SCALE_STOPS, applyScale, coloursAt, readScale, stopName, storeScale } from "../../lib/colourScale";
import { Fold } from "../ui/Fold";
import { thresholdOnOpen, setThresholdOnOpen } from "../../lib/week";
import { AI_USER_MONTHLY_USD } from "../../lib/aiCost";
import { PREMIUM_NAME, PREMIUM_OPEN_IN_BETA } from "../../lib/premium";
import { useAuth } from "../../lib/AuthContext";
import { useAppData } from "../../lib/AppDataContext";
import { BackRow, SectionTitle } from "../Primitives";
import { PLUGINS, usePlugin, useSetPlugin } from "../../lib/plugins";
import { exportMyData, downloadJson, deleteMyAccount } from "../../lib/accountData";
import { localDateKey } from "../../lib/week";
import { useNavigate } from "react-router-dom";
import { KRONK_FEEDS, disconnectKronk, goToKronk, refreshKronkLink, signsInWithKronk, useKronkFeeds, useKronkLink } from "../../lib/kronk";
import { supabase } from "../../lib/supabaseClient";
import { FloatingLabelField } from "../ui/Input";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { BACKGROUND_MODES, backgroundMode, setBackgroundMode } from "../../lib/showcase";
import ArtistProfileCard from "../showcase/ArtistProfileCard";

// "My YOU" — the personal identity screen (MVP Feature 1). Account-level
// bits (sign out) live here too since there's no separate Settings screen
// yet, not because they belong to the same concept long-term.
export default function Settings() {
  const { signOut } = useAuth();
  const { loaded, aiConsent, setAiConsentGranted } = useAppData();

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Your Own Universe</SectionTitle>

      {!loaded ? <div className="text-body text-textSecondary">Loading…</div> : <ProfileCard />}

      {/* Everything else folds away, one tidy row each (Cassidy, Oct 18). */}
      <div className="mt-5">
        <Fold ai title="AI reflections" hint={`${PREMIUM_NAME}${PREMIUM_OPEN_IN_BETA ? " · free in the beta" : ""} · ${aiConsent?.granted ? "on" : "off"}`}>
          <AiReflectionsSetting aiConsent={aiConsent} onChange={setAiConsentGranted} />
        </Fold>
        <Fold icon={Puzzle} title="Make YOU yours" hint="Turn optional parts on or off">
          <PluginsSetting />
        </Fold>
        <Fold icon={Sun} title="Opening YOU" hint="Land on the Threshold, or straight on Home">
          <ThresholdSetting />
        </Fold>
        <Fold image="/images/icons/light-dark.png" title="Colours" hint="Slide Nature and the Cosmos to your own shades">
          <ColourScaleSetting />
        </Fold>
        <Fold icon={Palette} title="Featured art on Home" hint="Artists' pieces in the welcome">
          <ShowcaseBackgroundSetting />
        </Fold>
        <Fold icon={Brush} title="Your artist profile" hint="How you're credited in the Showcase">
          <ArtistProfileCard />
        </Fold>
        <Fold icon={KronkMark} title="Kronk" hint="KommYOUnity, your feeds, signing in with Kronk">
          <KronkSetting />
        </Fold>
        <Fold icon={ShieldCheck} title="Your data" hint="Download everything, or delete your account">
          <YourDataSetting />
        </Fold>
      </div>

      <ReplayWelcome />

      <Button variant="secondary" icon={LogOut} onClick={() => signOut()} className="w-full mt-2">
        Sign out
      </Button>
    </div>
  );
}

// Kronk's Ж, sized like the other section icons.
function KronkMark() {
  return <span className="text-[16px] font-semibold leading-none" style={{ fontFamily: "Georgia, serif" }}>Ж</span>;
}

// Who you are, shown like a profile: name, where you are, and about you,
// with a small Edit in the corner that opens the three for changing.
function ProfileCard() {
  const { profile, saveProfile } = useAppData();
  const empty = !profile?.name && !profile?.location && !profile?.bio;
  const [editing, setEditing] = useState(empty);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  function reset() {
    setName(profile?.name || "");
    setBio(profile?.bio || "");
    setLocation(profile?.location || "");
  }
  useEffect(reset, [profile]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveProfile({ name: name.trim(), bio: bio.trim(), location: location.trim() });
      setSavedAt(Date.now());
      setEditing(false);
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

  const initial = (profile?.name || "").trim().charAt(0).toUpperCase();

  return (
    <div className="relative rounded-card bg-surface1 shadow-card p-5">
      {!editing ? (
        <>
          <button
            type="button"
            onClick={() => { setSavedAt(null); setEditing(true); }}
            className="absolute top-3 right-3 inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-full text-caption text-textSecondary hover:text-textPrimary hover:bg-surface2"
          >
            <PenLine size={14} strokeWidth={1.75} /> Edit
          </button>
          <div className="flex items-center gap-4 pr-16">
            <span
              className="w-16 h-16 rounded-full flex-none flex items-center justify-center font-serif text-[26px] text-cream shadow-card"
              style={{ background: "radial-gradient(circle at 35% 30%, var(--sage), var(--forest) 70%)" }}
              aria-hidden="true"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <div className="font-serif text-h2 text-textPrimary leading-tight break-words">{profile?.name || "Your name"}</div>
              {profile?.location && (
                <div className="flex items-center gap-1 text-caption text-textMuted mt-0.5">
                  <MapPin size={12} strokeWidth={1.75} /> {profile.location}
                </div>
              )}
            </div>
          </div>
          {profile?.bio ? (
            <p className="text-bodySm text-textSecondary whitespace-pre-line break-words mt-4 mb-0">{profile.bio}</p>
          ) : (
            <p className="text-bodySm text-textMuted italic mt-4 mb-0">A little about you, whenever you'd like.</p>
          )}
          {savedAt && <div className="text-caption text-sage mt-3">Saved.</div>}
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="text-bodySm text-textSecondary mb-3">Who you are, in your own words.</div>
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

          <div className="flex gap-2">
            {!empty && (
              <Button type="button" variant="ghost" className="flex-1" onClick={() => { reset(); setError(""); setEditing(false); }}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
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
    <div>
      <div className="text-caption text-textMuted mb-2">
        Every AI feature in YOU is part of {PREMIUM_NAME}{PREMIUM_OPEN_IN_BETA ? ", open to everyone while YOU is in beta" : ""}.
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
            <div className="h-full bg-gradient-to-r from-[#8C6A24] via-[#C9A24D] to-[#F3DE9C]" style={{ width: `${Math.min(100, (usage.usd / AI_USER_MONTHLY_USD) * 100)}%` }} />
          </div>
          <div className="text-caption text-textMuted mt-1">Resets on the 1st. When it's used up, AI reflections rest; everything else keeps working.</div>
        </div>
      )}
      {error && <div className="text-bodySm text-red-500 mb-2">{error}</div>}
      <Button variant="secondary" size="sm" disabled={saving || aiConsent === null} onClick={toggle}>
        {saving ? "Saving…" : on ? "Turn off AI reflections" : "Turn on AI reflections"}
      </Button>
      {on && <IncludeCoursesSetting aiConsent={aiConsent} />}
    </div>
  );
}

// A separate yes for courses: what's written in YOUniversity courses can be
// included when YOU writes a weekly reflection. Off unless chosen.
function IncludeCoursesSetting({ aiConsent }) {
  const { setIncludeCourses } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const include = Boolean(aiConsent?.include_courses);
  async function toggle() {
    setSaving(true);
    setError("");
    try { await setIncludeCourses(!include); } catch (e) {
      console.error("[Settings] include courses failed:", e);
      setError("Couldn't change that. Try again.");
    }
    setSaving(false);
  }
  return (
    <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
      <div className="text-bodySm text-textPrimary font-medium mb-1">Your courses</div>
      <div className="text-bodySm text-textSecondary mb-3">
        {include
          ? "Included. Your weekly reflection can draw on what you wrote in your courses that week."
          : "Not included. What you write in YOUniversity courses stays out of AI reflections."}
      </div>
      {error && <div className="text-bodySm text-red-500 mb-2">{error}</div>}
      <Button variant="secondary" size="sm" disabled={saving} onClick={toggle}>
        {saving ? "Saving…" : include ? "Keep my courses out" : "Include my courses"}
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
    <div>
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

// Artists' pieces can fill the welcome on Home. Remembered on this device.
function ShowcaseBackgroundSetting() {
  const [mode, setMode] = useState(backgroundMode);

  function pick(v) {
    setBackgroundMode(v);
    setMode(v);
  }

  return (
    <div>
      <div className="text-bodySm text-textSecondary mb-3">
        {mode === "off"
          ? "Off. Home keeps its own landscape. Shared pieces are still in the Showcase."
          : "When an artist's piece is featured, it fills the welcome on Home, credited to them. Dim or blur it if you'd like it quieter."}
      </div>
      <SegmentedControl options={BACKGROUND_MODES} value={mode} onChange={pick} />
    </div>
  );
}

// Optional parts of YOU, on or off per account (lib/plugins.js).
function PluginsSetting() {
  const setPlugin = useSetPlugin();
  return (
    <div>
      <div className="text-bodySm text-textSecondary mb-3">Turn on only what helps. Nothing you've added is lost when you turn something off.</div>
      {PLUGINS.map(p => <PluginRow key={p.key} plugin={p} onChange={on => setPlugin(p.key, on)} />)}
    </div>
  );
}

// Also used on What's new.
export function PluginRow({ plugin, onChange }) {
  const on = usePlugin(plugin.key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setSaving(true);
    setError("");
    try { await onChange(!on); } catch (e) {
      console.error("[Settings] plugin change failed:", e);
      setError("Couldn't change that. Check your connection and try again.");
    }
    setSaving(false);
  }
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-body text-textPrimary">{plugin.title}</div>
        <div className="text-caption text-textMuted">{plugin.desc}</div>
        {error && <div className="text-caption text-red-500 mt-1">{error}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={plugin.title}
        disabled={saving}
        onClick={toggle}
        className={`flex-none mt-0.5 inline-flex items-center gap-2 min-h-[36px] px-3 rounded-full text-caption font-medium border ${on ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"}`}
      >
        <span className={`w-2 h-2 rounded-full ${on ? "bg-onAccent" : "bg-textMuted"}`} aria-hidden="true" />
        {on ? "On" : "Off"}
      </button>
    </div>
  );
}

// Take everything with you, or leave entirely. Deleting asks for the word
// DELETE, so it can't happen by a stray tap.
function YourDataSetting() {
  const { userId, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setExporting(true);
    setExportNote("");
    try {
      const data = await exportMyData(userId);
      downloadJson(data, `YOU-my-data-${localDateKey()}.json`);
      setExportNote(data.skipped.length
        ? "Downloaded. A few parts couldn't be read just now; try again later for those."
        : "Downloaded. Your photos stay in the app; save any you'd like to keep from their moments.");
    } catch (e) {
      console.error("[Settings] export failed:", e);
      setExportNote("Couldn't put your download together. Check your connection and try again.");
    }
    setExporting(false);
  }

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      await deleteMyAccount();
      await signOut();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="text-bodySm text-textSecondary mb-3">
        Everything you make in YOU is yours. <a href="/privacy" className="underline underline-offset-2">Privacy &amp; beta terms</a>
      </div>
      <Button variant="secondary" size="sm" icon={Download} disabled={exporting} onClick={download}>
        {exporting ? "Gathering everything…" : "Download my data"}
      </Button>
      {exportNote && <div className="text-caption text-textSecondary mt-2">{exportNote}</div>}

      <div className="mt-5 pt-4 border-t border-borderC">
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-bodySm text-textMuted min-h-[44px]">
            <Trash2 size={14} strokeWidth={1.75} />
            Delete my account
          </button>
        ) : (
          <div>
            <div className="text-body text-textPrimary font-medium mb-1">Delete your account?</div>
            <div className="text-bodySm text-textSecondary mb-3">
              Everything goes: your journal, values, pursuits, photos and pieces you've shared. It can't be undone.
              You might like to download your data first.
            </div>
            <label className="block text-label uppercase text-textMuted mb-1.5" htmlFor="confirm-delete">Type DELETE to confirm</label>
            <input
              id="confirm-delete"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full bg-surface2 border border-borderC rounded-sm px-3 py-2.5 mb-3 text-body text-textPrimary outline-none focus:border-red-400"
            />
            {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setConfirming(false); setTyped(""); setError(""); }}>
                Keep my account
              </Button>
              <button
                type="button"
                disabled={typed.trim() !== "DELETE" || deleting}
                onClick={remove}
                className="flex-1 min-h-[40px] rounded-sm bg-red-700 text-white text-bodySm font-medium disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete everything"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// The first-run welcome, again (App shows it while prefs.welcomed is off).
function ReplayWelcome() {
  const { setPrefs } = useAuth();
  const [error, setError] = useState("");
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setPrefs({ welcomed: false }).catch(() => setError("Couldn't open it just now. Try again."))}
        className="text-bodySm text-textSecondary underline underline-offset-4 min-h-[44px]"
      >
        See the welcome again
      </button>
      {error && <div className="text-caption text-red-500">{error}</div>}
    </div>
  );
}

// Kronk (kronk.info): connect, see who you're connected as, or disconnect.
function KronkSetting() {
  const link = useKronkLink();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || null)); }, []);
  const kronkOnly = signsInWithKronk(email);

  async function run(fn) {
    setBusy(true);
    setError("");
    try { await fn(); } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <div>
      {link === undefined ? (
        <div className="text-bodySm text-textMuted">Checking…</div>
      ) : link ? (
        <>
          <div className="text-bodySm text-textSecondary mb-3">
            Connected as <span className="text-textPrimary">{link.handle}</span>. Your Kronk feed is in KommYOUnity.
            {kronkOnly && " You sign in to YOU with Kronk."}
          </div>
          <KronkFeedChoice />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("/community")}>Open KommYOUnity</Button>
            {!kronkOnly && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(async () => { await disconnectKronk(); refreshKronkLink(); })}>
                {busy ? "Disconnecting…" : "Disconnect"}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-bodySm text-textSecondary mb-3">
            Connect your Kronk account to see your mates in KommYOUnity, share moments from YOU, and sign in with Kronk.
          </div>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(() => goToKronk("link", "/settings"))}>
            {busy ? "Opening Kronk…" : "Connect Kronk"}
          </Button>
        </>
      )}
      {error && <div className="text-bodySm text-red-500 mt-2">{error}</div>}
    </div>
  );
}

// Which of Kronk's four feeds KommYOUnity shows, as tabs. At least one.
function KronkFeedChoice() {
  const { feeds, toggle } = useKronkFeeds();
  const [error, setError] = useState("");
  const on = v => feeds.some(f => f.value === v);
  return (
    <div className="mb-4">
      <div className="text-label uppercase text-textMuted mb-1.5">Feeds in KommYOUnity</div>
      <div className="space-y-1.5" role="group" aria-label="Feeds in KommYOUnity">
        {KRONK_FEEDS.map(f => {
          const checked = on(f.value);
          const last = checked && feeds.length === 1;
          return (
            <button
              key={f.value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              aria-disabled={last}
              title={last ? "Keep at least one feed" : undefined}
              onClick={() => { if (last) return; setError(""); toggle(f.value).catch(() => setError("Couldn't save that. Try again.")); }}
              className={`w-full flex items-center gap-3 rounded-sm border px-3 py-2 text-left ${checked ? "border-forestAccent bg-surface2" : "border-borderC"}`}
            >
              <span className={`w-4 h-4 rounded-[4px] border flex-none flex items-center justify-center text-[11px] ${checked ? "border-forestAccent bg-forestAccent text-onAccent" : "border-borderC"}`} aria-hidden="true">
                {checked ? "✓" : ""}
              </span>
              <span>
                <span className="block text-bodySm text-textPrimary">{f.label}</span>
                <span className="block text-caption text-textMuted">{f.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error && <div className="text-caption text-red-500 mt-1.5">{error}</div>}
    </div>
  );
}

// The colour scale: one slider for Nature (by day) and one for the Cosmos
// (by night). The side you're in changes as you slide; the other shows a
// small preview. Saved to the account a moment after you let go.
function ColourScaleSetting() {
  const { setPrefs } = useAuth();
  const [scale, setScale] = useState(readScale);
  const [error, setError] = useState("");
  const timer = useRef(null);

  function change(mode, pos) {
    save({ ...scale, [mode]: pos });
  }
  function save(next) {
    setScale(next);
    storeScale(next);
    applyScale(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPrefs({ colour_scale: next }).catch(() => setError("Saved on this device; couldn't save to your account just now."));
    }, 700);
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div>
      <div className="text-bodySm text-textSecondary mb-4">
        Your words stay easy to read at every shade. Switch between Nature and the Cosmos in the menu to see each side.
      </div>
      <ScaleSlider mode="light" title="Nature, by day" value={scale.light} onChange={v => change("light", v)} />
      <ScaleSlider mode="dark" title="The Cosmos, by night" value={scale.dark} onChange={v => change("dark", v)} />
      {(Math.abs(scale.light - SCALE_DEFAULT) > 0.5 || Math.abs(scale.dark - SCALE_DEFAULT) > 0.5) && (
        <button
          type="button"
          onClick={() => save({ light: SCALE_DEFAULT, dark: SCALE_DEFAULT })}
          className="inline-flex items-center gap-1.5 text-caption text-textSecondary min-h-[40px]"
        >
          <RotateCcw size={13} strokeWidth={1.75} /> Back to YOU's own colours
        </button>
      )}
      {error && <div className="text-caption text-red-500 mt-1">{error}</div>}
    </div>
  );
}

function ScaleSlider({ mode, title, value, onChange }) {
  const stops = SCALE_STOPS[mode];
  const track = `linear-gradient(90deg, ${stops.map(s => s.s1).join(", ")})`;
  const here = coloursAt(mode, value);
  const id = `scale-${mode}`;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-bodySm text-textPrimary">{title}</label>
        <span className="inline-flex items-center gap-1.5 text-caption text-textSecondary">
          <span className="w-4 h-4 rounded-full border border-borderC" style={{ background: here.s1 }} aria-hidden="true" />
          {stopName(mode, value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(value)}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuetext={stopName(mode, value)}
        className="you-scale w-full"
        style={{ "--track": track }}
      />
      <div className="flex justify-between text-caption text-textMuted mt-1" aria-hidden="true">
        {stops.map(s => <span key={s.label}>{s.label}</span>)}
      </div>
    </div>
  );
}
