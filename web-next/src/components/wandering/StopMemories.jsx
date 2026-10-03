import { useState } from "react";
import { BookOpen, Image as ImageIcon, Plus, MapPin } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey } from "../../lib/week";
import { niceDay } from "../../lib/wandering";
import AddMomentModal from "../journey/AddMomentModal";

// Everything remembered at one stop: memories pinned here, gentle
// suggestions from the days you were here (pin with one tap), and a way to
// add a new memory already placed here.
export default function StopMemories({ stop }) {
  const { moments, journalEntries, pinMemory } = useAppData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const asMemory = (kind, r) => ({
    kind, id: r.id, stopId: r.stop_id || null,
    date: kind === "moment" ? r.moment_date : r.entry_date,
    title: kind === "moment" ? r.title : r.content.slice(0, 80) + (r.content.length > 80 ? "…" : ""),
    photo: kind === "moment" ? r.photo_url : null,
    photoCount: kind === "moment" ? (r.photo_urls || []).length : 0,
    raw: r
  });
  const all = [...moments.map(m => asMemory("moment", m)), ...journalEntries.map(e => asMemory("entry", e))];
  const pinned = all.filter(m => m.stopId === stop.id).sort((a, b) => (a.date > b.date ? 1 : -1));
  const end = stop.depart || stop.arrive;
  const suggestions = stop.arrive
    ? all.filter(m => !m.stopId && m.date >= stop.arrive && m.date <= end)
    : [];

  async function pin(m, stopId) {
    setBusy(m.id);
    setError("");
    try {
      await pinMemory(m.kind, m.id, stopId);
    } catch (e) {
      console.error("[StopMemories] pin failed:", e);
      setError("Couldn't change that. Check your connection and try again.");
    }
    setBusy(null);
  }

  const today = localDateKey();
  const addDate = stop.arrive && stop.arrive <= today && end >= today ? today : stop.arrive || today;

  const Row = ({ m, action }) => (
    <div className="flex items-center gap-2.5 py-1.5">
      {m.photo
        ? (
          <span className="relative flex-none">
            <img src={m.photo} alt="" className="w-9 h-9 rounded-sm object-cover" />
            {m.photoCount > 1 && (
              <span className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-forestAccent text-surface2 text-[10px] leading-4 text-center">{m.photoCount}</span>
            )}
          </span>
        )
        : (
          <span className="w-9 h-9 rounded-sm bg-surface3 flex items-center justify-center flex-none text-textMuted">
            {m.kind === "moment" ? <ImageIcon size={15} strokeWidth={1.75} /> : <BookOpen size={15} strokeWidth={1.75} />}
          </span>
        )}
      <button
        type="button"
        onClick={() => m.kind === "moment" && setEditing(m.raw)}
        className="flex-1 min-w-0 text-left"
        disabled={m.kind !== "moment"}
      >
        <span className="block text-bodySm text-textPrimary truncate">{m.title}</span>
        <span className="block text-caption text-textMuted">{m.kind === "moment" ? "Memory" : "Journal"} · {niceDay(m.date)}</span>
      </button>
      {action}
    </div>
  );

  return (
    <div>
      <span className="block text-label uppercase text-textMuted mb-1">Memories here</span>
      {pinned.length === 0 && suggestions.length === 0 && (
        <p className="text-caption text-textMuted mb-1">Nothing remembered here yet.</p>
      )}
      {pinned.map(m => (
        <Row
          key={m.kind + m.id}
          m={m}
          action={
            <button type="button" disabled={busy === m.id} onClick={() => pin(m, null)} className="flex-none text-caption text-textMuted">
              Unpin
            </button>
          }
        />
      ))}

      {suggestions.length > 0 && (
        <div className="mt-2">
          <span className="block text-caption text-textSecondary mb-0.5">From your days here</span>
          {suggestions.map(m => (
            <Row
              key={m.kind + m.id}
              m={m}
              action={
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => pin(m, stop.id)}
                  className="flex-none inline-flex items-center gap-1 text-caption text-forestAccent font-medium"
                >
                  <MapPin size={12} strokeWidth={1.75} />
                  Pin here
                </button>
              }
            />
          ))}
        </div>
      )}

      <button type="button" onClick={() => setAdding(true)} className="mt-1.5 inline-flex items-center gap-1.5 text-caption text-forestAccent font-medium">
        <Plus size={13} strokeWidth={1.75} />
        Add a memory here
      </button>
      {error && <div className="text-caption text-error mt-1">{error}</div>}

      <AddMomentModal open={adding} onClose={() => setAdding(false)} defaults={adding ? { momentDate: addDate, stopId: stop.id } : undefined} />
      <AddMomentModal open={Boolean(editing)} moment={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
