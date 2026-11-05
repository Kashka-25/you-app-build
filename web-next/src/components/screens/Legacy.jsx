import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { yearsWithLife, yearSummary, placesInYear } from "../../lib/years";
import YearStory, { yearCover, yearDusk, Backdrop, BACKDROP_WIDE } from "../journey/YearStory";
import { storyCover } from "../../lib/myStory";
import { useAuth } from "../../lib/AuthContext";

// Your years (was Legacy; Cassidy, Nov 5: folded into YOUrney and made
// "much more neater and experiential"). Your life year by year as picture
// cards, each opening into a story to tap through, with My Story, your
// life as a book, at the top. Opened from YOUrney's Memories.
export default function Legacy() {
  const data = useAppData();
  const { profile, moments } = data;
  const years = data.loaded ? yearsWithLife(data) : [];
  const thisYear = new Date().getFullYear();
  const [openYear, setOpenYear] = useState(null);
  const { prefs } = useAuth();
  const bookPhoto = storyCover(moments, prefs?.story_cover);
  const span = years.length ? (years.length === 1 ? `${years[0]}` : `${years[years.length - 1]} – ${years[0]}`) : "";

  return (
    <div className="pt-1 pb-24 px-5 relative isolate">
      {/* The same painted reading place as My Story, behind the page
          (Cassidy, Nov 5); softened so the cards stay the focus. */}
      <picture className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <source media="(min-width: 768px)" srcSet="/images/journey/my-story-backdrop-wide.webp" />
        <img
          src="/images/journey/my-story-backdrop-tall.webp"
          alt=""
          onError={e => { e.currentTarget.style.display = "none"; }}
          className="w-full h-full object-cover opacity-70 dark:opacity-30"
        />
      </picture>
      <section aria-labelledby="years-title" className="relative mt-3 mb-5 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/tool-years.webp"
          onError={e => { if (!e.currentTarget.src.endsWith("/yourney.webp")) e.currentTarget.src = "/images/home/yourney.webp"; }}
          alt=""
          width="705"
          height="380"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/45 via-30% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/60" />
        <Link
          to="/journey"
          state={{ tab: "chapters" }}
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-white/70 dark:bg-black/35 border border-borderC dark:border-white/15 text-caption text-textPrimary dark:text-cream backdrop-blur-sm"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> YOUrney
        </Link>
        <div className="relative flex flex-col justify-end min-h-[220px] p-4 pt-16">
          <h1 id="years-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">Your years</h1>
          <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">Your life, year by year, as you've kept it.</p>
        </div>
      </section>

      {/* My Story (Cassidy, Nov 5: "more cohesive with the pages"): a card in
          the same family as the headers and year cards, the painted reading
          place behind it and the chosen cover photo framed like a print. */}
      <Link
        to="/my-story"
        className="group relative block rounded-card overflow-hidden shadow-card mb-7 border border-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
        aria-label="My Story: your life so far as a book"
      >
        <img
          src="/images/journey/my-story-backdrop-wide.webp"
          alt=""
          loading="lazy"
          onError={e => { e.currentTarget.style.display = "none"; }}
          className="absolute inset-0 w-full h-full object-cover dark:brightness-[0.55]"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-[#FBF7F0]/10 via-[#FBF7F0]/55 to-[#FBF7F0]/85 dark:from-black/20 dark:via-[#0B0B1F]/55 dark:to-[#0B0B1F]/80" />
        <span className="relative flex items-center gap-4 p-4 min-h-[156px]">
          <span className="flex-none w-[92px] p-1.5 pb-4 bg-white shadow-card rotate-[-3deg] transition-transform duration-300 group-hover:rotate-0" style={{ border: "1px solid #E8DCC4" }} aria-hidden="true">
            {bookPhoto
              ? <img src={bookPhoto.thumb} alt="" className="w-full aspect-[4/5] object-cover" />
              : <span className="block w-full aspect-[4/5] bg-[#F3E6D3]" />}
          </span>
          <span className="min-w-0">
            <span className="block text-label uppercase tracking-[0.16em] text-gold">Kept in YOU{span ? ` · ${span}` : ""}</span>
            <span className="block font-serif text-[28px] leading-tight text-textPrimary dark:text-cream mt-0.5">My Story</span>
            <span className="block text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_85%,transparent)] mt-0.5">
              Your life so far as a book, in your own words.
            </span>
            <span className="inline-flex items-center gap-1 mt-2 min-h-[36px] px-3.5 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium">
              Open the book <ChevronRight size={15} strokeWidth={1.75} />
            </span>
          </span>
        </span>
      </Link>

      <h2 className="font-serif text-h2 text-textPrimary m-0 mb-2.5">Year by year</h2>
      {!data.loaded && <div className="text-bodySm text-textSecondary">Gathering your years…</div>}
      <ul className="list-none m-0 p-0 space-y-3">
        {years.map(y => {
          const cover = yearCover(y, moments);
          const s = yearSummary(y, data);
          const p = placesInYear(y, data);
          const line = [
            p.countries.length ? p.countries.join(" · ") : null,
            s.moments ? `${s.moments} ${s.moments === 1 ? "memory" : "memories"}` : null,
            s.entries ? `${s.entries} ${s.entries === 1 ? "entry" : "entries"}` : null
          ].filter(Boolean).join(" · ");
          return (
            <li key={y}>
              <button
                type="button"
                onClick={() => setOpenYear(y)}
                className="relative w-full h-[132px] rounded-card overflow-hidden shadow-card text-left text-white"
                aria-label={`Open ${y}${line ? `: ${line}` : ""}`}
              >
                <span className="absolute inset-0" style={{ background: yearDusk(y) }} />
                {cover ? (
                  <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    {/* the painted year (design/chatgpt-prompts/years-backdrop.md),
                        tinted by the year's own dusk so each feels its own */}
                    <Backdrop src={BACKDROP_WIDE} className="absolute inset-0 w-full h-full object-cover opacity-75" />
                  </>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <span className="absolute left-4 right-10 bottom-3">
                  <span className="block font-serif text-[34px] leading-none">{y}{y === thisYear && <span className="font-sans text-caption text-white/80 ml-2 align-middle">this year</span>}</span>
                  <span className="block text-caption text-white/85 mt-1 truncate">{line || "A quiet year in YOU"}</span>
                </span>
                <ChevronRight size={20} strokeWidth={1.75} className="absolute right-3 bottom-4 text-white/85" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      {openYear != null && <YearStory year={openYear} onClose={() => setOpenYear(null)} />}
    </div>
  );
}
