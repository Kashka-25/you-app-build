import { useEffect, useState } from "react";
import { ExternalLink, Palette, Plus, X } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useAppData } from "../../lib/AppDataContext";
import { LINK_KINDS, fitText, normalizeHandle, normalizeUrl } from "../../lib/showcase";
import { loadArtistProfile, saveArtistProfile } from "../../lib/showcaseApi";
import { Button } from "../ui/Button";

const YOURIGIN_SHARED = "https://kashka-25.github.io/YOUrigin/#/shared";
const field = "w-full bg-surface2 border border-borderC rounded-sm px-3 py-2.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent";

// The same artist profile YOUrigin edits: one of you across both apps.
// Shown on every piece you share to the Showcase.
export default function ArtistProfileCard() {
  const { userId } = useAuth();
  const { profile } = useAppData();
  const [p, setP] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [problems, setProblems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!userId) return;
    loadArtistProfile(userId)
      .then(row => {
        setIsNew(!row);
        setP(
          row
            ? { display_name: row.display_name, bio: row.bio || "", links: Array.isArray(row.links) ? row.links : [], kronk_handle: row.kronk_handle || "" }
            : { display_name: fitText(profile?.name, 60), bio: fitText(profile?.bio, 280), links: [], kronk_handle: "" }
        );
      })
      .catch(e => {
        console.error("[ArtistProfile] load failed:", e);
        setProblems(["Couldn't load your artist profile just now."]);
      });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) {
    return problems.length ? <div className="mt-4 text-bodySm text-red-500">{problems[0]}</div> : null;
  }

  const setLink = (i, patch) => setP({ ...p, links: p.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  async function submit(e) {
    e.preventDefault();
    const found = [];
    if (!p.display_name.trim()) found.push("Add the name you want to be credited as.");
    const handle = normalizeHandle(p.kronk_handle);
    if (handle === null) found.push("Your Kronk handle should look like @name@server.");
    const links = p.links.map(l => ({ kind: l.kind, label: (l.label || "").trim(), url: normalizeUrl(l.url) }));
    links.forEach((l, i) => { if (!l.url) found.push(`Link ${i + 1} must be a web address starting https://.`); });
    setProblems(found);
    if (found.length) return;
    setSaving(true);
    try {
      await saveArtistProfile(userId, { display_name: p.display_name.trim(), bio: p.bio.trim(), links, kronk_handle: handle });
      setIsNew(false);
      setSavedAt(Date.now());
    } catch (err) {
      console.error("[ArtistProfile] save failed:", err);
      setProblems([err?.message || "Couldn't save. Try again."]);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-card bg-surface1 shadow-card p-4">
      <div className="flex items-center gap-2 text-label uppercase text-gold mb-2">
        <Palette size={13} strokeWidth={1.75} />
        Artist profile
      </div>
      <div className="text-bodySm text-textSecondary mb-3">
        How you're credited when you share art or words from YOUrigin to the Showcase. It's one profile: YOUrigin edits the same one.
        {isNew && (profile?.name || profile?.bio) ? " Started from your YOU profile." : ""}
      </div>

      <label className="block text-label uppercase text-textMuted mb-1">Credited as</label>
      <input className={`${field} mb-3`} maxLength={60} value={p.display_name} onChange={e => setP({ ...p, display_name: e.target.value })} />

      <label className="block text-label uppercase text-textMuted mb-1">A line about you</label>
      <textarea className={`${field} mb-3`} rows={2} maxLength={280} value={p.bio} onChange={e => setP({ ...p, bio: e.target.value })} />

      <label className="block text-label uppercase text-textMuted mb-1">Kronk handle (optional)</label>
      <input
        className={`${field} mb-3`}
        value={p.kronk_handle}
        onChange={e => setP({ ...p, kronk_handle: e.target.value })}
        placeholder="@you@kronk.social"
        autoCapitalize="off"
      />

      <div className="text-label uppercase text-textMuted mb-1">Support links</div>
      {p.links.map((l, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <select
            className={`${field} !w-auto`}
            value={LINK_KINDS[l.kind] ? l.kind : "other"}
            onChange={e => setLink(i, { kind: e.target.value })}
            aria-label={`Link ${i + 1} kind`}
          >
            {Object.entries(LINK_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input
            className={`${field} min-w-0 flex-1`}
            value={l.url}
            onChange={e => setLink(i, { url: e.target.value })}
            placeholder="ko-fi.com/you"
            aria-label={`Link ${i + 1} address`}
            autoCapitalize="off"
          />
          <button type="button" onClick={() => setP({ ...p, links: p.links.filter((_, j) => j !== i) })} aria-label={`Remove link ${i + 1}`} className="p-2 text-textMuted">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      ))}
      {p.links.length < 8 && (
        <button
          type="button"
          onClick={() => setP({ ...p, links: [...p.links, { kind: "kofi", label: "", url: "" }] })}
          className="inline-flex items-center gap-1.5 min-h-[36px] text-bodySm text-forestAccent mb-2"
        >
          <Plus size={14} strokeWidth={1.75} /> Add a link
        </button>
      )}
      <div className="text-caption text-textMuted mb-3">Contributions go straight to you through these links. YOU never takes a share.</div>

      {problems.length > 0 && (
        <ul role="alert" className="list-disc pl-5 text-bodySm text-red-500 mb-3">
          {problems.map(x => <li key={x}>{x}</li>)}
        </ul>
      )}
      {savedAt && !problems.length && <div className="text-bodySm text-sage mb-3">Saved. YOUrigin shows the same.</div>}

      <Button type="submit" variant="secondary" size="sm" disabled={saving} className="w-full min-h-[44px]">
        {saving ? "Saving…" : isNew ? "Create artist profile" : "Save artist profile"}
      </Button>
      <a href={YOURIGIN_SHARED} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 min-h-[36px] text-caption text-forestAccent">
        Share a piece from YOUrigin <ExternalLink size={12} strokeWidth={1.75} />
      </a>
    </form>
  );
}
