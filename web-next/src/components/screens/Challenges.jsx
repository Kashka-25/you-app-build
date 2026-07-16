import { useState } from "react";
import { Check, X, Plus } from "lucide-react";
import { BackRow, SectionTitle, Pill } from "../Primitives";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

// Personal hardship-tracking, distinct from Pursue's goals/habits/dreams --
// per BUILD-BACKLOG.md's "now has a real proposed purpose" note. Self-rated
// honesty-scale XP, therapist-suggested challenges the user can accept or
// reject (rejected ones move to their own tab instead of disappearing).
// All local state -- no backing data model exists for this yet.
const HONESTY_SCALE = [
  { value: 1, label: "A little" },
  { value: 3, label: "Genuinely hard" },
  { value: 5, label: "Everything I had" }
];

const SUGGESTED_SEED = [
  { id: "s1", text: "Set one boundary with a family member this week", from: "Leah S." },
  { id: "s2", text: "Sit with a difficult feeling for 5 minutes without distraction", from: "Kai T." }
];

const TABS = [
  { value: "active", label: "Active" },
  { value: "suggested", label: "Suggested" },
  { value: "overcome", label: "Overcome" }
];

export default function Challenges() {
  const [tab, setTab] = useState("active");
  const [text, setText] = useState("");
  const [active, setActive] = useState([]);
  const [overcome, setOvercome] = useState([]);
  const [suggested, setSuggested] = useState(SUGGESTED_SEED);
  const [rejected, setRejected] = useState([]);
  const [rating, setRating] = useState(null);

  function addChallenge() {
    if (!text.trim()) return;
    setActive(prev => [...prev, { id: `c${Date.now()}`, text: text.trim() }]);
    setText("");
  }
  function markOvercome(id, honesty) {
    const item = active.find(c => c.id === id);
    if (!item) return;
    setActive(prev => prev.filter(c => c.id !== id));
    setOvercome(prev => [...prev, { ...item, honesty }]);
    setRating(null);
  }
  function acceptSuggestion(s) {
    setSuggested(prev => prev.filter(x => x.id !== s.id));
    setActive(prev => [...prev, { id: s.id, text: s.text, from: s.from }]);
  }
  function rejectSuggestion(s) {
    setSuggested(prev => prev.filter(x => x.id !== s.id));
    setRejected(prev => [...prev, s]);
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Challenges</SectionTitle>
      <Pill muted>your honesty scale, your pace — not standard XP</Pill>

      <div className="my-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "active" && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-surface1 border border-borderC rounded-sm px-3 py-2 text-body outline-none focus:border-forestAccent"
              placeholder="A challenge you're facing"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addChallenge()}
            />
            <Button variant="primary" icon={Plus} onClick={addChallenge}>Add</Button>
          </div>

          {active.length === 0 ? (
            <EmptyState title="Nothing logged yet" description="Name what you're facing — no pressure to solve it today." />
          ) : (
            active.map(c => (
              <div key={c.id} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
                <div className="text-body text-textPrimary mb-1">{c.text}</div>
                {c.from && <div className="text-caption text-textMuted mb-2">Suggested by {c.from}</div>}
                <div className="text-label uppercase text-textMuted mb-1.5 mt-2">How much did overcoming this take?</div>
                <div className="flex gap-2 mb-2">
                  {HONESTY_SCALE.map(h => (
                    <button
                      key={h.value}
                      onClick={() => setRating(h.value)}
                      className={`flex-1 text-caption px-2 py-1.5 rounded-sm border ${
                        rating === h.value ? "bg-forestAccent text-surface2 border-forestAccent" : "border-borderC text-textSecondary"
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={rating === null}
                  onClick={() => markOvercome(c.id, rating)}
                >
                  Mark as overcome
                </Button>
              </div>
            ))
          )}
        </>
      )}

      {tab === "suggested" && (
        <>
          {suggested.length === 0 ? (
            <EmptyState title="No suggestions right now" description="A therapist can suggest a challenge for you to consider." />
          ) : (
            suggested.map(s => (
              <div key={s.id} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
                <div className="text-body text-textPrimary mb-1">{s.text}</div>
                <div className="text-caption text-textMuted mb-3">Suggested by {s.from}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={X} className="flex-1" onClick={() => rejectSuggestion(s)}>Not now</Button>
                  <Button variant="primary" size="sm" icon={Check} className="flex-1" onClick={() => acceptSuggestion(s)}>Accept</Button>
                </div>
              </div>
            ))
          )}
          {rejected.length > 0 && (
            <>
              <div className="text-label uppercase text-textMuted mt-5 mb-2">Not now ({rejected.length})</div>
              {rejected.map(s => (
                <div key={s.id} className="rounded-card bg-surface1 p-3.5 mb-2 opacity-60">
                  <div className="text-bodySm text-textSecondary">{s.text}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {tab === "overcome" && (
        overcome.length === 0 ? (
          <EmptyState title="Nothing here yet" description="Challenges you mark as overcome will collect here." />
        ) : (
          overcome.map(c => (
            <div key={c.id} className="rounded-card bg-surface1 shadow-card p-4 mb-3 opacity-80">
              <div className="text-body text-textPrimary mb-1">{c.text}</div>
              <div className="text-caption text-gold">Honesty: {HONESTY_SCALE.find(h => h.value === c.honesty)?.label}</div>
            </div>
          ))
        )
      )}
    </div>
  );
}
