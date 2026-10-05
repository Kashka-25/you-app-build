import { useState } from "react";
import { Plus, Map, Wheat } from "lucide-react";
import { SectionTitle, ExploreLink } from "../Primitives";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import AddMomentModal from "./AddMomentModal";
import { PhotoCarousel } from "../ui/PhotoCarousel";
import { PlaceTag } from "../wandering/PlacePicker";
import SuggestChaptersPanel from "./SuggestChaptersPanel";
import SeasonCard from "./SeasonCard";

function niceMomentDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function inRange(momentDate, start, end) {
  const d = new Date(momentDate + "T00:00:00").getTime();
  return d >= new Date(start + "T00:00:00").getTime() && d <= new Date(end + "T00:00:00").getTime();
}

// The photos swipe on their own; the rest of the card opens the editor.
function MomentCard({ moment, onEdit }) {
  const hasPhotos = (moment.photo_urls || []).length > 0;
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      {hasPhotos && <PhotoCarousel urls={moment.photo_urls} className="h-44 mb-3" />}
      <button onClick={() => onEdit(moment)} className="block w-full text-left">
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <div className="font-serif text-h3 text-textPrimary">{moment.title}</div>
          <span className="text-caption text-textMuted flex-none">{niceMomentDate(moment.moment_date)}</span>
        </div>
        {moment.description && <div className="text-bodySm text-textSecondary">{moment.description}</div>}
        <PlaceTag stopId={moment.stop_id} className="mt-1.5" />
        {!hasPhotos && <div className="text-caption text-textMuted mt-1.5">Tap to edit or add photos</div>}
      </button>
    </div>
  );
}

// Harvest notes kept during a chapter: what each week held, in your words.
function chapterHarvests(harvests, chapter) {
  return harvests
    .filter(h => (h.note || "").trim() && h.week_start >= chapter.range_start && (!chapter.range_end || h.week_start <= chapter.range_end))
    .sort((a, b) => (a.week_start > b.week_start ? 1 : -1));
}

function ChapterGroup({ chapter, moments, harvests, onEditMoment }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      <button className="w-full text-left flex items-start gap-3" onClick={() => setOpen(o => !o)}>
        <GlowBubble icon={Map} size={40} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-3">
            <div className="font-serif text-h3 text-textPrimary">{chapter.title}</div>
            <span className="text-caption text-textMuted flex-none">
              {niceMomentDate(chapter.range_start)} – {niceMomentDate(chapter.range_end)}
            </span>
          </div>
          <div className="text-bodySm text-textSecondary">{chapter.blurb}</div>
          <div className="text-caption text-gold mt-1.5">
            {moments.length} {moments.length === 1 ? "moment" : "moments"}
            {harvests.length > 0 && ` · ${harvests.length} ${harvests.length === 1 ? "harvest" : "harvests"}`} — {open ? "hide" : "show"}
          </div>
        </div>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-borderC">
          {moments.map(m => <MomentCard key={m.id} moment={m} onEdit={onEditMoment} />)}
          {harvests.length > 0 && (
            <div className="mt-1">
              <div className="flex items-center gap-1.5 text-label uppercase text-textMuted mb-1.5">
                <Wheat size={12} strokeWidth={1.75} /> From your harvests
              </div>
              {harvests.map(h => (
                <div key={h.week_start} className="border-l-2 border-gold pl-2.5 mb-2">
                  <div className="text-caption text-textMuted">Week of {niceMomentDate(h.week_start)}</div>
                  <div className="text-bodySm text-textPrimary italic">{h.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChaptersView() {
  const { moments, chapters: savedChapters, weekHarvests } = useAppData();
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
      <SeasonCard />

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
                <ChapterGroup key={chapter.id} chapter={chapter} moments={chapterMoments} harvests={chapterHarvests(weekHarvests, chapter)} onEditMoment={setEditingMoment} />
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
