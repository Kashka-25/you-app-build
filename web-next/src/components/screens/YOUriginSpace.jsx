import { useEffect, useState } from "react";
import { ExternalLink, Palette } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { loadMyWorks } from "../../lib/showcaseApi";
import { PLACEMENTS } from "../../lib/showcase";
import { BackRow } from "../Primitives";
import { Guide } from "../ui/Guide";
import { EmptyState } from "../ui/EmptyState";
import ArtistProfileCard from "../showcase/ArtistProfileCard";

// The YOUrigin extra (Cassidy, Oct 28): YOUrigin is its own app, so this
// is YOU's doorway to it, the way YOUr Projects is its own space. It opens
// YOUrigin, keeps the shared artist profile, and shows where each piece
// shared from there stands in Showcase.
const YOURIGIN = "https://kashka-25.github.io/YOUrigin/";

const STATUS = {
  waiting: { label: "Waiting for a look", tone: "bg-surface3 text-textSecondary" },
  live: { label: "Live in Showcase", tone: "bg-forestAccent text-onAccent" },
  declined: { label: "Not this time", tone: "bg-surface3 text-textMuted" },
  removed: { label: "Taken down", tone: "bg-surface3 text-textMuted" }
};

function niceDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export default function YOUriginSpace() {
  const { userId } = useAuth();
  const [works, setWorks] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    loadMyWorks(userId)
      .then(w => { if (live) setWorks(w); })
      .catch(e => { console.error("[YOUrigin] load failed:", e); if (live) setError("Your pieces couldn't load just now."); });
    return () => { live = false; };
  }, [userId]);

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0 flex items-center gap-2.5">
        <img src="/images/icons/yourigin@4x.png" alt="" width="52" height="52" className="w-[52px] h-[52px] flex-none" />
        YOUrigin
      </h1>
      <p className="text-body text-textSecondary mt-2">Where your creations begin. Share your art and words into YOU's Showcase, with credit and your own support links.</p>
      <Guide className="mt-1">
        In YOUrigin, open any piece and tap Share to YOU. Choose words or an image, where it may appear, and whether to ask for support. It waits for a look before going live, and editing it sends it back to wait.
      </Guide>

      <a
        href={YOURIGIN}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-sm bg-forestAccent text-onAccent font-medium shadow-card"
      >
        Open YOUrigin <ExternalLink size={16} strokeWidth={1.75} />
      </a>
      <div className="text-caption text-textMuted mt-1.5 text-center">Sign in there with this same account.</div>

      <h2 className="font-serif text-h3 mt-7 mb-2">Your shared pieces</h2>
      {error ? (
        <div className="text-bodySm text-textMuted">{error}</div>
      ) : !works ? (
        <div className="text-bodySm text-textMuted">Loading…</div>
      ) : works.length === 0 ? (
        <EmptyState icon={Palette} title="Nothing shared yet" description="Pieces you share from YOUrigin show here, with where each one stands." />
      ) : (
        <div className="space-y-2.5">
          {works.map(w => {
            const st = STATUS[w.status] || STATUS.waiting;
            return (
              <div key={w.id} className="rounded-card bg-surface1 shadow-card p-3 flex gap-3">
                {w.imageUrl ? (
                  <img src={w.imageUrl} alt={w.alt_text || ""} className="w-16 h-16 rounded-sm object-cover flex-none" />
                ) : (
                  <div className="w-16 h-16 rounded-sm bg-surface3 flex-none p-2 text-caption text-textSecondary font-serif italic overflow-hidden line-clamp-3">{w.body}</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-body text-textPrimary truncate">{w.title || (w.kind === "words" ? "Words" : "Untitled")}</div>
                  <span className={`inline-block text-caption px-2 py-0.5 rounded-full mt-1 ${st.tone}`}>{st.label}</span>
                  <div className="text-caption text-textMuted mt-1">
                    {(w.placements || []).map(p => PLACEMENTS[p] || p).join(" · ")}
                    {w.submitted_at && ` · shared ${niceDate(w.submitted_at)}`}
                  </div>
                  {w.review_note && w.status !== "live" && <div className="text-caption text-textSecondary mt-1">“{w.review_note}”</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <a href={YOURIGIN + "#/shared"} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 min-h-[36px] text-caption text-forestAccent">
        Manage them in YOUrigin <ExternalLink size={12} strokeWidth={1.75} />
      </a>

      <h2 className="font-serif text-h3 mt-6 mb-2">Your artist profile</h2>
      <ArtistProfileCard />
    </div>
  );
}
