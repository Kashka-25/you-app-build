import { SectionTitle, ExploreLink } from "../Primitives";

// Mock data — structure matters more than content right now. Chapters are
// the "zoomed out" level: multi-month/year eras with a name and date range,
// each gathering Constellation-dots + mood data from that period into a
// readable arc. Distinct from Constellations (individual memory-dots).
const MOCK_CHAPTERS = [
  { name: "Learning to Feel", range: "2019 – 2021", blurb: "Naming what had been unspoken, and finding it survivable." },
  { name: "Becoming Steady", range: "2021 – 2023", blurb: "Routines took root. The ground stopped moving so much." },
  { name: "Season of Rebuilding", range: "2023 – Present", blurb: "Where the story picks up today." }
];

function ChapterCard({ name, range, blurb }) {
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <div className="font-serif text-h3 text-textPrimary">{name}</div>
        <span className="text-caption text-textMuted flex-none">{range}</span>
      </div>
      <div className="text-bodySm text-textSecondary">{blurb}</div>
    </div>
  );
}

export default function ChaptersView() {
  return (
    <>
      <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
        <div className="text-label uppercase text-textMuted mb-1">Current Season</div>
        <div className="font-serif text-h3 text-gold">Season of Letting Go</div>
        <div className="text-bodySm text-textSecondary mt-1">AI-inferred from recent mood and activity — replaces a plain % progress bar.</div>
      </div>

      <SectionTitle>Life chapters</SectionTitle>
      {MOCK_CHAPTERS.map(c => (
        <ChapterCard key={c.name} {...c} />
      ))}

      <SectionTitle>Your pursuits</SectionTitle>
      <ExploreLink to="/pursue" label="habits, goals & dreams" sub="full functional list — add, tag, complete" />
    </>
  );
}
