import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { BackRow, SectionTitle } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { MOODS } from "../ui/Input";
import JournalEntryModal from "../journal/JournalEntryModal";
import WeeklyReflectionView from "../journal/WeeklyReflectionView";

const TABS = [
  { value: "entries", label: "Entries" },
  { value: "week", label: "This Week" }
];

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function EntryCard({ entry, onEdit }) {
  const moodInfo = MOODS.find(m => m.key === entry.mood);
  return (
    <button onClick={() => onEdit(entry)} className="block w-full text-left rounded-card bg-surface1 shadow-card p-4 mb-3">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <span className="text-caption text-textMuted">{niceDate(entry.entry_date)}</span>
        {moodInfo && (
          <span className="flex items-center gap-1 text-caption text-textMuted">
            <moodInfo.Icon size={14} strokeWidth={1.75} />
            {moodInfo.label}
          </span>
        )}
      </div>
      <div className="text-bodySm text-textPrimary whitespace-pre-wrap line-clamp-4">{entry.content}</div>
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map(t => (
            <span key={t} className="text-caption bg-surface3 text-textSecondary px-2 py-0.5 rounded-full">#{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function Reflections() {
  const { journalEntries, loaded } = useAppData();
  const [tab, setTab] = useState("entries");
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // After a first save, reopen the same entry in edit mode (instead of just
  // closing) so photos and an AI reflection — which both need a real
  // entry_id — are immediately available without a second trip to Reflections.
  function handleSaved(saved) {
    setAddOpen(false);
    setEditingEntry(saved);
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex justify-between items-start">
        <SectionTitle>Reflections</SectionTitle>
        {tab === "entries" && (
          <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)} className="mt-5">Write</Button>
        )}
      </div>
      <div className="text-bodySm text-textSecondary -mt-2 mb-4">Your journal — just for you.</div>

      <div className="mb-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "week" ? (
        <WeeklyReflectionView />
      ) : !loaded ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : journalEntries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing written yet"
          description="Whatever's on your mind — a thought, a mood, how today went. Tap Write to start."
          actionLabel="Write your first entry"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        journalEntries.map(entry => <EntryCard key={entry.id} entry={entry} onEdit={setEditingEntry} />)
      )}

      <JournalEntryModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={handleSaved} />
      <JournalEntryModal
        open={Boolean(editingEntry)}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
