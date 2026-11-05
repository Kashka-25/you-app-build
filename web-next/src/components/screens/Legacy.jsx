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
    <div className="pt-1 pb-24 px-5">
      <section aria-labelledby="years-title" className="relative mt-3 mb-5 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/yourney.webp"
          alt=""
          width="705"
          height="380"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_30%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/70 via-40% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/70" />
        <Link
          to="/journey"
          state={{ tab: "chapters" }}
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-white/70 dark:bg-black/35 border border-borderC dark:border-white/15 text-caption text-textPrimary dark:text-cream backdrop-blur-sm"
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> YOUrney
        </Link>
        <div className="relative flex flex-col justify-end min-h-[176px] p-4 pt-16">
          <h1 id="years-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">Your years</h1>
          <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">Your life, year by year, as you've kept it.</p>
        </div>
      </section>

      {/* My Story, as the book it is */}
      <Link to="/my-story" className="group flex items-center gap-4 mb-7" aria-label="My Story: your life so far as a book">
        <span
          className="relative flex-none w-[104px] h-[150px] rounded-r-md rounded-l-sm shadow-card flex flex-col items-center justify-center text-center px-2 transition-transform group-hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #2F4A3A 0%, #1F3328 100%)",
            boxShadow: "inset 6px 0 0 rgba(0,0,0,0.25), inset 7px 0 0 rgba(255,255,255,0.06), 0 8px 18px -8px rgba(0,0,0,0.5)"
          }}
          aria-hidden="true"
        >
          <span className="absolute inset-[6px] left-[12px] border border-[#C9A24D]/50 rounded-sm" />
          {bookPhoto && <img src={bookPhoto.thumb} alt="" className="relative w-[58px] h-[46px] object-cover rounded-[2px] mb-1 border border-[#C9A24D]/60" />}
          <span className="text-[8px] tracking-[0.2em] uppercase text-[#E8C877]">Kept in YOU</span>
          <span className="font-serif text-[19px] leading-tight text-[#F7EEDC] mt-1">My Story</span>
          {profile?.name && <span className="font-serif italic text-[11px] text-[#E8C877] mt-1">{profile.name.trim().split(" ")[0]}</span>}
          {span && <span className="text-[9px] text-[#F7EEDC]/70 mt-1.5">{span}</span>}
        </span>
        <span className="min-w-0">
          <span className="block font-serif text-h2 text-textPrimary leading-tight">My Story</span>
          <span className="block text-bodySm text-textSecondary mt-0.5">Your life so far as a book, made only from what you've kept. Read it, print it, or keep a copy.</span>
          <span className="inline-flex items-center gap-1 mt-1.5 text-bodySm font-medium text-forestAccent">Open the book <ChevronRight size={15} strokeWidth={1.75} /></span>
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
                    <Backdrop src={BACKDROP_WIDE} className="absolute inset-0 w-full h-full object-cover opacity-75" />
                    {/* the places that year reached, written softly across it */}
                    {p.countries.length > 0 && (
                      <span aria-hidden="true" className="absolute right-3 top-3 max-w-[70%] text-right font-serif italic text-[26px] leading-tight text-white/25">
                        {p.countries.join(" · ")}
                      </span>
                    )}
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
