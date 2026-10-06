import { useEffect, useState } from "react";
import { BookPlus, Users } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { findInCodex } from "../../lib/valueWords";
import { BackRow } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "planned", label: "Planned" },
  { value: "added", label: "Added" },
  { value: "declined", label: "Not for the Codex" }
];

function when(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// For Cassidy as creator: the values people name in their own words that
// the Codex doesn't hold yet, with how many people reached for each (never
// who, and never what they wrote around it). A prompt to write them in.
export default function CodexRequests() {
  const { isAdmin, adminChecked, loadCodexRequests, setCodexWordStatus } = useAppData();
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("new");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setRows(await loadCodexRequests());
    } catch (e) {
      console.error("[CodexRequests] load failed:", e);
      setError("Couldn't load the requests just now.");
      setRows([]);
    }
  }
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function mark(r, status) {
    setRows(prev => prev.map(x => (x.normalized === r.normalized ? { ...x, status } : x)));
    try {
      await setCodexWordStatus(r.normalized, status);
      await refresh();
    } catch (e) {
      console.error("[CodexRequests] status failed:", e);
      setError("Couldn't save that. Try again.");
      refresh();
    }
  }

  if (!adminChecked) {
    return <div className="pt-1 pb-24 px-5"><BackRow /><div className="text-body text-textSecondary mt-4">Loading…</div></div>;
  }
  if (!isAdmin) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={BookPlus} title="For the creator" description="This page is only for whoever writes the Codex." />
      </div>
    );
  }

  const shown = (rows || []).filter(r => r.status === tab);
  const counts = Object.fromEntries(STATUSES.map(s => [s.value, (rows || []).filter(r => r.status === s.value).length]));

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0">Codex requests</h1>
      <div className="text-bodySm text-textSecondary mt-2 mb-4">
        Values people have named in their own words that the Codex doesn't hold yet. You see how many people, never who.
      </div>

      <div className="mb-4">
        <SegmentedControl
          options={STATUSES.map(s => ({ value: s.value, label: counts[s.value] ? `${s.label} · ${counts[s.value]}` : s.label }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}

      {rows === null ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={BookPlus}
          title={tab === "new" ? "Nothing new" : "Nothing here"}
          description={tab === "new" ? "When someone names a value the Codex doesn't hold, it'll appear here, and a gold dot will show on the menu." : "Words you move here will gather in this list."}
        />
      ) : (
        shown.map(r => {
          // It may have been written into the Codex since (or match a synonym).
          const home = findInCodex(r.word);
          return (
            <div key={r.normalized} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-serif text-h2 text-textPrimary">{r.word}</div>
                  <div className="text-caption text-textMuted mt-0.5">
                    First {when(r.first_seen)} · last {when(r.last_seen)}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-bodySm text-textPrimary bg-surface3 rounded-full px-2.5 py-1 flex-none">
                  <Users size={13} strokeWidth={1.75} /> {r.people}
                </span>
              </div>
              {home && (
                <div className="text-caption text-forestAccent mt-2">
                  {home.via === "name" ? `Now in the Codex as ${home.value.name}.` : `Matches the Codex: ${home.via} of ${home.value.name}.`}
                </div>
              )}
              {tab === "new" && !home && (
                <div className="text-caption text-textSecondary mt-2">
                  To write it in, ask Claude: "Draft a Codex entry for {r.word}".
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {STATUSES.filter(s => s.value !== r.status).map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => mark(r, s.value)}
                    className="text-caption px-3 py-1.5 rounded-full border border-borderC text-textSecondary hover:border-forestAccent hover:text-textPrimary"
                  >
                    {s.value === "new" ? "Back to new" : s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
