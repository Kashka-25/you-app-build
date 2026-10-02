import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Star, Wheat } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { yearsWithLife, yearSummary } from "../../lib/years";
import { BackRow, SectionTitle, DropdownSection } from "../Primitives";
import YearInPlaces from "../wandering/YearInPlaces";

// One year in the life: where you went, then what it held.
function YearBody({ year }) {
  const data = useAppData();
  const s = yearSummary(year, data);
  const notes = s.harvests.filter(h => (h.note || "").trim());
  return (
    <div className="pb-4 space-y-4">
      <YearInPlaces year={year} />
      <div>
        <div className="text-label uppercase text-textMuted mb-1.5">What {year} held</div>
        <div className="text-bodySm text-textPrimary">
          {s.moments} {s.moments === 1 ? "memory" : "memories"} · {s.entries} journal {s.entries === 1 ? "entry" : "entries"} · {s.harvests.length} {s.harvests.length === 1 ? "harvest" : "harvests"}
        </div>
        {s.dreams.length > 0 && (
          <div className="flex items-start gap-1.5 text-bodySm text-textSecondary mt-1">
            <Star size={13} strokeWidth={1.75} className="text-gold mt-0.5 flex-none" />
            {s.dreams.join(" · ")}
          </div>
        )}
        {notes.slice(0, 3).map(h => (
          <div key={h.week_start} className="mt-2 border-l-2 border-gold pl-2.5">
            <div className="flex items-center gap-1 text-caption text-textMuted"><Wheat size={11} strokeWidth={1.75} /> Week of {new Date(h.week_start + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
            <div className="text-bodySm italic text-textPrimary">{h.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Legacy — your life, year by year: the places each year took you and what
// it held. One day this becomes the "My Story" memoir export.
export default function Legacy() {
  const data = useAppData();
  const years = data.loaded ? yearsWithLife(data) : [];
  const thisYear = new Date().getFullYear();

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Legacy</SectionTitle>
      <p className="text-bodySm text-textSecondary -mt-1 mb-4">Your life, year by year: where it took you, and what each year held.</p>

      <Link to="/mirror" className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-4 mb-5">
        <Sparkles size={20} strokeWidth={1.75} className="text-gold flex-none" />
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-h3 text-textPrimary">The Mirror</span>
          <span className="block text-caption text-textSecondary">This year so far, and this week one year ago</span>
        </span>
        <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
      </Link>

      <div className="font-serif text-h2 text-textPrimary mb-1">Your years</div>
      {!data.loaded && <div className="text-bodySm text-textSecondary">Gathering your years…</div>}
      {years.map(y => (
        <DropdownSection key={y} title={y === thisYear ? `${y} · this year` : String(y)} defaultOpen={y === thisYear}>
          <YearBody year={y} />
        </DropdownSection>
      ))}

      <p className="text-caption text-textMuted mt-6">
        One day, all of this can become your memoir, "My Story", exported as a book. That part is still to come.
      </p>
    </div>
  );
}
