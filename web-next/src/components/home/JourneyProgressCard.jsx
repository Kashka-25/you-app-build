import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, GraduationCap } from "lucide-react";
import { ProgressRing } from "../ui/ProgressRing";

// The stairway under the moon, across the top of the card.
function PathBanner({ id, to }) {
  return (
    <div className="relative h-[132px] -mx-4 -mt-4 mb-4 overflow-hidden">
      <img src="/images/home/journey-stairs.webp" alt="" width="703" height="373" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[center_45%] dark:brightness-[0.7]" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface1 via-surface1/40 to-transparent dark:from-black/70 dark:via-black/20" />
      <div className="absolute inset-x-4 bottom-2 flex items-end justify-between gap-3">
        <h2 id={id} className="font-serif text-h2 text-textPrimary dark:text-cream m-0">Your journey</h2>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-caption text-textSecondary dark:text-cream/90 hover:underline min-h-[32px]">
            View all <ChevronRight size={14} strokeWidth={1.75} />
          </Link>
        )}
      </div>
    </div>
  );
}

// The course being walked, with real progress (parts finished out of the
// whole path, from courseState). Other courses sit underneath as one line
// each. With no course yet, an invitation to find one instead.
export default function JourneyProgressCard({ entries }) {
  const [main, ...rest] = entries;

  if (!main) {
    return (
      <section aria-labelledby="home-journey" className="rounded-card overflow-hidden bg-surface1 shadow-card p-4">
        <PathBanner id="home-journey" />
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 flex-none rounded-full bg-surface3 flex items-center justify-center text-forestAccent">
            <GraduationCap size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body text-textPrimary m-0">Begin a guided journey</p>
            <p className="text-bodySm text-textSecondary m-0 mt-0.5">YOUniversity holds paths for real change, one small part at a time.</p>
            <Link to="/youniversity" className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium hover:bg-forest">
              Explore YOUniversity <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const resting = main.kind === "resting";
  return (
    <section aria-labelledby="home-journey" className="rounded-card overflow-hidden bg-surface1 shadow-card p-4">
      <PathBanner id="home-journey" to="/youniversity" />
      <div className="flex items-center gap-4">
        <div className="flex-none" role="img" aria-label={`${main.percent}% of ${main.arcanum.name}: ${main.done} of ${main.total} parts done`}>
          <ProgressRing value={main.percent} size={84} stroke={7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-h3 text-textPrimary leading-snug">{main.arcanum.name}</div>
          {main.stage && <div className="text-caption text-[#7A6024] dark:text-gold mt-0.5">{main.stage}</div>}
          <div className="text-bodySm text-textSecondary mt-1 line-clamp-2">{main.title}</div>
        </div>
      </div>
      <Link
        to={main.to}
        className={`mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full text-body font-medium ${
          resting ? "border border-borderC text-textPrimary hover:bg-surface3" : "bg-forestAccent text-onAccent hover:bg-forest"
        }`}
      >
        {resting ? "See where you are" : "Continue"} <ArrowRight size={16} strokeWidth={2} />
      </Link>

      {rest.length > 0 && (
        <div className="mt-3 pt-3 border-t border-borderC space-y-1">
          {rest.map(e => (
            <Link key={e.key} to={e.to} className="flex items-center gap-3 min-h-[44px]">
              <span className="flex-1 min-w-0">
                <span className="block text-bodySm text-textPrimary truncate">{e.arcanum.name}</span>
                <span className="block text-caption text-textMuted truncate">{e.kind === "resting" ? "Resting" : e.title}</span>
              </span>
              <span className="text-caption text-textSecondary">{e.percent}%</span>
              <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
