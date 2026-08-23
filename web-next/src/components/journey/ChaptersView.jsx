import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionTitle, ExploreLink } from "../Primitives";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import AddMomentModal from "./AddMomentModal";
import SuggestChaptersPanel from "./SuggestChaptersPanel";

function niceMomentDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function inRange(momentDate, start, end) {
  const d = new Date(momentDate + "T00:00:00").getTime();
  return d >= new Date(start + "T00:00:00").getTime() && d <= new Date(end + "T00:00:00").getTime();
}

function MomentCard({ moment, onEdit }) {
  return (
    <button onClick={() => onEdit(moment)} className="block w-full text-left rounded-card bg-surface1 shadow-card p-4 mb-3">
      {moment.photo_url && (
        <img src={moment.photo_url} alt="" className="w-full h-36 object-cover rounded-sm mb-3" />
      )}
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <div className="font-serif text-h3 text-textPrimary">{moment.title}</div>
        <span className="text-caption text-textMuted flex-none">{niceMomentDate(moment.moment_date)}</span>
      </div>
      {moment.description && <div className="text-bodySm text-textSecondary">{moment.description}</div>}
      {!moment.photo_url && <div className="text-caption text-textMuted mt-1.5">Tap to edit or add a photo</div>}
    </button>
  );
}

function ChapterGroup({ chapter, moments, onEditMoment }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <div className="font-serif text-h3 text-textPrimary">{chapter.title}</div>
          <span className="text-caption text-textMuted flex-none">
            {niceMomentDate(chapter.range_start)} – {niceMomentDate(chapter.range_end)}
          </span>
        </div>
        <div className="text-bodySm text-textSecondary">{chapter.blurb}</div>
        <div className="text-caption text-gold mt-1.5">{moments.length} {moments.length === 1 ? "moment" : "moments"} — {open ? "hide" : "show"}</div>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-borderC">
          {moments.map(m => <MomentCard key={m.id} moment={m} onEdit={onEditMoment} />)}
        </div>
      )}
    </div>
  );
}

export default function ChaptersView() {
  const { moments, chapters: savedChapters } = useAppData();
  const chapters = [...savedChapters].sort((a, b) => new Date(b.range_start) - new Date(a.range_start));
  const [addOpen, setAddOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);

  const sortedMoments = [...moments].sort((a, b) => new Date(b.moment_date) - new Date(a.moment_date));
  const placedIds = new Set();
  const grouped = chapters.map(c => {
    const inChapter = sortedMoments.filter(m => inRange(m.moment_date, c.range_start, c.range_end));
    inChapter.forEach(m => placedIds.add(m.id));
    return { chapter: c, moments: inChapter };
  });
  const unplaced = sortedMoments.filter(m => !placedIds.has(m.id));

  return (
    <>
      <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
        <div className="text-label uppercase text-textMuted mb-1">Current Season</div>
        <div className="font-serif text-h3 text-gold">Season of Letting Go</div>
        <div className="text-bodySm text-textSecondary mt-1">Preview only — AI-inferred seasons aren't built yet.</div>
      </div>

      <SectionTitle>Your pursuits</SectionTitle>
      <ExploreLink to="/pursue" label="habits, goals & dreams" sub="full functional list — add, tag, complete" />

      <div className="flex justify-between items-start mt-5">
        <SectionTitle>Your timeline</SectionTitle>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAddOpen(true)}>Add memory</Button>
      </div>

      {moments.length === 0 ? (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textMuted">
          No memories yet — tap "Add memory" to start your timeline. Backfill past moments or add new ones as they happen.
        </div>
      ) : (
        <>
          <SuggestChaptersPanel />

          {grouped.length > 0 && (
            <>
              <SectionTitle>Life chapters</SectionTitle>
              {grouped.map(({ chapter, moments: chapterMoments }) => (
                <ChapterGroup key={chapter.id} chapter={chapter} moments={chapterMoments} onEditMoment={setEditingMoment} />
              ))}
            </>
          )}

          {unplaced.length > 0 && (
            <>
              <SectionTitle>{grouped.length > 0 ? "Not yet in a chapter" : "Moments"}</SectionTitle>
              {unplaced.map(m => <MomentCard key={m.id} moment={m} onEdit={setEditingMoment} />)}
            </>
          )}
        </>
      )}

      <AddMomentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddMomentModal open={Boolean(editingMoment)} moment={editingMoment} onClose={() => setEditingMoment(null)} />
    </>
  );
}
