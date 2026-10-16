import { useEffect, useState } from "react";
import { Flag, Palette } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { clearReports, loadReviewQueue, reviewWork } from "../../lib/showcaseApi";
import { PLACEMENTS, creditLine, supportLinks } from "../../lib/showcase";
import { BackRow } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";

const TABS = [
  { value: "waiting", label: "Waiting" },
  { value: "live", label: "Live" },
  { value: "reported", label: "Reported" },
  { value: "declined", label: "Declined" },
  { value: "removed", label: "Removed" }
];

function when(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
}

// For Cassidy as creator: every piece artists share waits here, and nothing
// is shown on YOU until it's approved.
export default function ShowcaseReview() {
  const { isAdmin, adminChecked } = useAppData();
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("waiting");
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setRows(await loadReviewQueue());
    } catch (e) {
      console.error("[ShowcaseReview] load failed:", e);
      setError("Couldn't load the Showcase list just now.");
      setRows([]);
    }
  }
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function decide(w, decision) {
    setError("");
    try {
      await reviewWork(w.id, decision, notes[w.id]);
      await refresh();
    } catch (e) {
      console.error("[ShowcaseReview] review failed:", e);
      setError("Couldn't save that. Try again.");
    }
  }

  async function dismissReports(w) {
    try {
      await clearReports(w.id);
      await refresh();
    } catch (e) {
      console.error("[ShowcaseReview] clear reports failed:", e);
      setError("Couldn't clear those reports.");
    }
  }

  if (!adminChecked) {
    return <div className="pt-1 pb-24 px-5"><BackRow /><div className="text-body text-textSecondary mt-4">Loading…</div></div>;
  }
  if (!isAdmin) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={Palette} title="For the creator" description="This page is only for whoever looks after the Showcase." />
      </div>
    );
  }

  const inTab = w => (tab === "reported" ? w.reports.length > 0 : w.status === tab);
  const shown = (rows || []).filter(inTab);
  const count = t => (rows || []).filter(w => (t === "reported" ? w.reports.length > 0 : w.status === t)).length;

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0">Showcase review</h1>
      <div className="text-bodySm text-textSecondary mt-2 mb-4">
        Pieces artists have shared from YOUrigin. Nothing appears on YOU until you approve it.
      </div>

      <div className="mb-4">
        <SegmentedControl
          options={TABS.map(t => ({ value: t.value, label: count(t.value) ? `${t.label} · ${count(t.value)}` : t.label }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}

      {rows === null ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={Palette} title={tab === "waiting" ? "Nothing waiting" : "Nothing here"} description={tab === "waiting" ? "New shares from YOUrigin will wait here for you." : ""} />
      ) : (
        shown.map(w => {
          const name = w.artist?.display_name || "Artist (no profile yet)";
          const links = supportLinks(w.artist?.links);
          return (
            <article key={w.id} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
              {w.kind === "image" && w.imageUrl && (
                <img src={w.imageUrl} alt={w.alt_text || ""} className="w-full max-h-[320px] object-contain rounded-sm bg-surface3 mb-3" />
              )}
              {w.kind === "words" && (
                <p className="font-serif text-body text-textPrimary whitespace-pre-line m-0 mb-3 pl-3 border-l-2 border-gold max-h-[240px] overflow-y-auto">{w.body}</p>
              )}
              <div className="font-serif text-h3 text-textPrimary">{w.title || (w.kind === "image" ? "Untitled image" : "Untitled words")}</div>
              <div className="text-caption text-textSecondary mt-0.5">{creditLine(name, w.credits)}</div>
              <div className="text-caption text-textMuted mt-1">
                Sent {when(w.submitted_at)} · {(w.placements || []).map(p => PLACEMENTS[p] || p).join(", ")} ·{" "}
                {w.save_mode === "contribution" ? `save after a contribution${w.suggested_amount ? ` (${w.suggested_amount})` : ""}` : "free to save"}
              </div>
              {w.kind === "image" && w.body && <div className="text-caption text-textSecondary mt-1">Caption: {w.body}</div>}
              {w.kind === "image" && !w.alt_text && <div className="text-caption text-gold mt-1">No description for screen readers.</div>}
              <div className="text-caption text-textMuted mt-1">
                {links.length ? `Links: ${links.map(l => `${l.label} (${new URL(l.url).host})`).join(", ")}` : "No support links yet."}
              </div>
              {w.review_note && <div className="text-caption text-textSecondary mt-1">Your note: {w.review_note}</div>}

              {w.reports.length > 0 && (
                <div className="mt-2 rounded-sm bg-surface3 p-2">
                  <div className="flex items-center gap-1.5 text-caption text-textPrimary font-medium">
                    <Flag size={12} strokeWidth={1.75} /> {w.reports.length} {w.reports.length === 1 ? "report" : "reports"}
                  </div>
                  {w.reports.filter(r => r.reason).map(r => (
                    <div key={r.id} className="text-caption text-textSecondary mt-1">“{r.reason}” · {when(r.created_at)}</div>
                  ))}
                </div>
              )}

              {(w.status === "waiting" || w.status === "live") && (
                <input
                  type="text"
                  value={notes[w.id] || ""}
                  onChange={e => setNotes(n => ({ ...n, [w.id]: e.target.value }))}
                  maxLength={500}
                  placeholder={w.status === "waiting" ? "A note if you decline (the artist sees it)" : "A note if you take it down (the artist sees it)"}
                  aria-label="Note for the artist"
                  className="w-full mt-3 rounded-sm border border-borderC bg-surface2 px-2.5 py-2 text-bodySm text-textPrimary"
                />
              )}

              <div className="flex flex-wrap gap-1.5 mt-3">
                {w.status !== "live" && <Action onClick={() => decide(w, "approve")} primary>Approve</Action>}
                {w.status === "waiting" && <Action onClick={() => decide(w, "decline")}>Decline</Action>}
                {w.status === "live" && <Action onClick={() => decide(w, "feature")}>Feature again now</Action>}
                {w.status === "live" && <Action onClick={() => decide(w, "remove")}>Take down</Action>}
                {w.reports.length > 0 && <Action onClick={() => dismissReports(w)}>Dismiss reports</Action>}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}

function Action({ primary, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`text-caption px-3 py-1.5 min-h-[36px] rounded-full border ${
        primary ? "bg-forestAccent text-onAccent border-forestAccent" : "border-borderC text-textSecondary hover:border-forestAccent hover:text-textPrimary"
      }`}
    >
      {children}
    </button>
  );
}
