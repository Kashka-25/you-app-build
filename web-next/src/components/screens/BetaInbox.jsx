import { useEffect, useMemo, useState } from "react";
import { Bug, ChevronDown, ExternalLink, Heart, LifeBuoy, Lightbulb, MessageSquareHeart, RefreshCw } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { supabase } from "../../lib/supabaseClient";
import { BackRow } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";

// For Cassidy as creator: what testers send with "Send feedback", and the
// short crash reports screens leave behind. Testers appear only as a short
// reference (the start of their account id), never a name or email; crash
// reports never hold anything a Seeker wrote. Readable by admins only
// (database policies), so this screen shows nothing to anyone else.
const KINDS = {
  problem: { icon: LifeBuoy, label: "Something's not right" },
  idea: { icon: Lightbulb, label: "An idea" },
  love: { icon: Heart, label: "Something I love" }
};
const TABS = [
  { value: "feedback", label: "Feedback" },
  { value: "crashes", label: "Crash reports" }
];

function when(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
const ref = id => (id ? id.slice(0, 8) : "unknown");

export default function BetaInbox() {
  const { isAdmin, adminChecked } = useAppData();
  const [tab, setTab] = useState("feedback");
  const [feedback, setFeedback] = useState(null);
  const [crashes, setCrashes] = useState(null);
  const [kind, setKind] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const [f, c] = await Promise.all([
      supabase.from("beta_feedback").select("id,user_id,body,kind,screen,notion_url,created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("client_errors").select("id,user_id,message,stack,path,user_agent,created_at").order("created_at", { ascending: false }).limit(500)
    ]);
    if (f.error || c.error) {
      console.error("[BetaInbox] load failed:", f.error || c.error);
      setError("Couldn't load everything just now. Try Refresh.");
    }
    setFeedback(f.data || []);
    setCrashes(c.data || []);
  }
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!adminChecked) {
    return <div className="pt-1 pb-24 px-5"><BackRow /><div className="text-body text-textSecondary mt-4">Loading…</div></div>;
  }
  if (!isAdmin) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={MessageSquareHeart} title="For the creator" description="This page is only for whoever looks after YOU." />
      </div>
    );
  }

  const testers = new Set([...(feedback || []).map(f => f.user_id), ...(crashes || []).map(c => c.user_id)].filter(Boolean)).size;

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex items-center justify-between gap-3 mt-4">
        <h1 className="font-serif text-h2 font-medium m-0">Tester inbox</h1>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 text-caption text-textSecondary min-h-[40px]">
          <RefreshCw size={14} strokeWidth={1.75} /> Refresh
        </button>
      </div>
      <div className="text-caption text-textMuted mt-1 mb-4">
        {feedback ? `${feedback.length} notes · ${crashes.length} crash reports · from ${testers} ${testers === 1 ? "tester" : "testers"}` : "Gathering…"}
      </div>

      <div className="mb-4"><SegmentedControl options={TABS} value={tab} onChange={setTab} /></div>
      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      {tab === "feedback" ? (
        <FeedbackList rows={feedback} kind={kind} setKind={setKind} />
      ) : (
        <CrashList rows={crashes} />
      )}
    </div>
  );
}

function FeedbackList({ rows, kind, setKind }) {
  if (rows === null) return <div className="text-bodySm text-textMuted">Gathering…</div>;
  if (rows.length === 0) {
    return <EmptyState icon={MessageSquareHeart} title="No feedback yet" description="When testers use Send feedback in the side menu, their notes arrive here (and in Build Notes)." />;
  }
  const counts = Object.fromEntries(Object.keys(KINDS).map(k => [k, rows.filter(r => r.kind === k).length]));
  const shown = kind === "all" ? rows : rows.filter(r => r.kind === kind);
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[["all", `All · ${rows.length}`], ...Object.entries(KINDS).map(([k, v]) => [k, `${v.label} · ${counts[k]}`])].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={`text-caption px-2.5 py-1 rounded-full ${kind === k ? "bg-forestAccent text-onAccent" : "bg-surface3 text-textMuted"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {shown.map(f => {
          const K = KINDS[f.kind] || KINDS.idea;
          return (
            <article key={f.id} className="rounded-card bg-surface1 shadow-card p-4">
              <div className="flex items-center gap-2 text-caption text-textMuted mb-1.5">
                <K.icon size={14} strokeWidth={1.75} className="text-gold" />
                <span className="text-textSecondary">{K.label}</span>
                <span className="ml-auto">{when(f.created_at)}</span>
              </div>
              <p className="text-bodySm text-textPrimary whitespace-pre-line break-words m-0">{f.body}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-textMuted mt-2">
                <span>Tester {ref(f.user_id)}</span>
                {f.screen && <span>on {f.screen}</span>}
                {f.notion_url && (
                  <a href={f.notion_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-forestAccent">
                    In Build Notes <ExternalLink size={11} strokeWidth={1.75} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

// The same crash from many people shows once, with how often and how many.
function CrashList({ rows }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of rows || []) {
      const key = `${c.message}|${c.path}`;
      const g = map.get(key) || { key, message: c.message, path: c.path, items: [] };
      g.items.push(c);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => new Date(b.items[0].created_at) - new Date(a.items[0].created_at));
  }, [rows]);

  if (rows === null) return <div className="text-bodySm text-textMuted">Gathering…</div>;
  if (rows.length === 0) {
    return <EmptyState icon={Bug} title="No crashes reported" description="If a screen ever trips over itself, a short technical note lands here: the error, the page and the browser. Never what anyone wrote." />;
  }
  return <div className="space-y-2.5">{groups.map(g => <CrashGroup key={g.key} g={g} />)}</div>;
}

function CrashGroup({ g }) {
  const [open, setOpen] = useState(false);
  const people = new Set(g.items.map(i => i.user_id)).size;
  const latest = g.items[0];
  return (
    <article className="rounded-card bg-surface1 shadow-card p-4">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full text-left">
        <div className="flex items-center gap-2 text-caption text-textMuted mb-1">
          <Bug size={14} strokeWidth={1.75} className="text-red-500" />
          <span>{g.items.length} {g.items.length === 1 ? "time" : "times"} · {people} {people === 1 ? "tester" : "testers"}</span>
          <span className="ml-auto">{when(latest.created_at)}</span>
          <ChevronDown size={14} strokeWidth={1.75} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
        <div className="text-bodySm text-textPrimary font-mono break-words">{g.message}</div>
        <div className="text-caption text-textMuted mt-1">on {g.path || "unknown page"}</div>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-borderC space-y-2">
          <div className="text-caption text-textMuted">Latest browser: {latest.user_agent || "unknown"}</div>
          {latest.stack && (
            <pre className="text-[11px] leading-snug text-textSecondary bg-surface2 rounded-sm p-2.5 overflow-x-auto whitespace-pre-wrap max-h-64">{latest.stack}</pre>
          )}
        </div>
      )}
    </article>
  );
}
