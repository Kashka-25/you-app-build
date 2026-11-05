import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Printer, Download, Lock, SlidersHorizontal } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { goBack } from "../../lib/week";
import { SECTIONS, buildStory, storyToMarkdown, niceDate, tripLine, coverPhotos, storyCover } from "../../lib/myStory";
import { useAuth } from "../../lib/AuthContext";
import { Check } from "lucide-react";
import { Button } from "../ui/Button";

function Heading({ children }) {
  return <h3 className="font-serif text-[20px] text-[#294D3A] mt-6 mb-2">{children}</h3>;
}

// "My Story" — the memoir, made from what the Seeker has kept. Built here in
// the browser and never uploaded. Printing (or saving as PDF) gives the
// laid-out book; the text download gives a plain Markdown copy.
export default function MyStory() {
  const navigate = useNavigate();
  const data = useAppData();
  const [include, setInclude] = useState(() => Object.fromEntries(SECTIONS.map(s => [s.key, s.on])));
  const book = useMemo(() => (data.loaded ? buildStory(data, include) : null), [data, include]);
  // Read a page at a time (Cassidy, Nov 5: "neater and experiential"):
  // cover, contents, each year, chapters, what you're growing toward.
  // Printing still lays out every page (tokens.css).
  const [page, setPage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { prefs, setPrefs } = useAuth();
  const photos = useMemo(() => coverPhotos(data.moments || []), [data.moments]);
  const cover = storyCover(data.moments || [], prefs?.story_cover);
  const pageCount = book ? 2 + book.years.length + (book.chapters.length ? 1 : 0) + (book.growing ? 1 : 0) : 0;
  const at = Math.min(page, Math.max(0, pageCount - 1));
  const turn = d => {
    setPage(n => Math.max(0, Math.min(pageCount - 1, n + d)));
    document.querySelector(".my-story .book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const off = i => (i === at ? "" : " book-off");
  const touch = useRef(null);
  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowRight") turn(1);
      if (e.key === "ArrowLeft") turn(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const yearPage = i => 2 + i;
  const chaptersPage = book ? 2 + book.years.length : 0;
  const growingPage = book ? chaptersPage + (book.chapters.length ? 1 : 0) : 0;

  function download() {
    const blob = new Blob([storyToMarkdown(book)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-story-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="min-h-dvh bg-bg font-sans my-story relative isolate">
      {/* The painted reading place behind the book (design/chatgpt-prompts/
          my-story-backdrop.md): on screen only, and only once it's added. */}
      <picture className="no-print fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <source media="(min-width: 768px)" srcSet="/images/journey/my-story-backdrop-wide.webp" />
        <img
          src="/images/journey/my-story-backdrop-tall.webp"
          alt=""
          onError={e => { e.currentTarget.style.display = "none"; }}
          className="w-full h-full object-cover opacity-80 dark:opacity-40"
        />
      </picture>
      {/* Controls: never printed. */}
      <div className="no-print max-w-[640px] mx-auto px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <button onClick={() => goBack(navigate)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary mb-5">
          <ArrowLeft size={16} strokeWidth={1.75} /> Back
        </button>
        <div className="text-label uppercase text-gold mb-1">Your years</div>
        <h1 className="font-serif text-hero text-textPrimary m-0">My Story</h1>
        <p className="text-bodySm text-textSecondary mt-1 mb-3">
          Your life so far, as a book, made only from what you've kept, in your own words.
        </p>

        <button
          type="button"
          onClick={() => setSettingsOpen(o => !o)}
          aria-expanded={settingsOpen}
          className="w-full flex items-center gap-2 min-h-[44px] px-4 rounded-card bg-surface1 shadow-card text-bodySm text-textPrimary"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} className="text-textMuted" />
          <span className="flex-1 text-left">What goes in, print or keep a copy</span>
          <ChevronDown size={16} strokeWidth={1.75} className={`text-textMuted transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
        </button>
        {settingsOpen && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mt-2">
          {photos.length > 0 && (
            <>
              <div className="text-label uppercase text-textMuted mb-2">Cover photo</div>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" role="radiogroup" aria-label="Cover photo">
                {photos.map(p => {
                  const on = cover?.path === p.path;
                  return (
                    <button
                      key={p.path}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={p.title}
                      onClick={() => setPrefs({ story_cover: p.path })}
                      className={`relative flex-none w-16 h-16 rounded-sm overflow-hidden border-2 ${on ? "border-gold" : "border-transparent"}`}
                    >
                      <img src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                      {on && <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-gold text-white flex items-center justify-center"><Check size={12} strokeWidth={2.5} /></span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="text-label uppercase text-textMuted mb-2">What goes in</div>
          <div className="flex flex-wrap gap-1.5">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                role="switch"
                aria-checked={include[s.key]}
                onClick={() => { setInclude(prev => ({ ...prev, [s.key]: !prev[s.key] })); setPage(0); }}
                className={`text-caption px-2.5 py-1 rounded-full border ${
                  include[s.key] ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-1.5 text-caption text-textMuted mt-3">
            <Lock size={12} strokeWidth={1.75} className="mt-0.5 flex-none" />
            Put together on this device and never uploaded. From your YOUrnal, only the highlights you chose to keep go in, never whole entries.
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Button icon={Printer} onClick={() => window.print()} disabled={!book}>Print or save as PDF</Button>
            <Button variant="secondary" icon={Download} onClick={download} disabled={!book}>Download text</Button>
          </div>
        </div>
        )}
      </div>

      {!book ? (
        <div className="no-print max-w-[640px] mx-auto px-5 text-body text-textSecondary">Gathering your story…</div>
      ) : (
        <>
        <article
          className="book max-w-[640px] mx-auto bg-[#FFFDF9] text-[#2B2B2B] shadow-card sm:rounded-card px-8 py-10 min-h-[70dvh] scroll-mt-4"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", boxShadow: "inset 10px 0 18px -14px rgba(0,0,0,0.35), 0 10px 30px -14px rgba(0,0,0,0.35)" }}
          onTouchStart={e => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 60) turn(dx < 0 ? 1 : -1);
          }}
        >
          {/* Cover */}
          <section className={`book-cover text-center py-16${off(0)}`}>
            {cover && (
              <div className="mx-auto mb-8 w-[72%] max-w-[340px] p-2 bg-white shadow-card rotate-[-1.2deg]" style={{ border: "1px solid #E8DCC4" }}>
                <img src={cover.url} alt="" className="w-full aspect-[4/5] object-cover" />
              </div>
            )}
            <div className="text-[13px] tracking-[0.2em] uppercase text-[#C9A24D]" style={{ fontFamily: "DM Sans, sans-serif" }}>Kept in YOU</div>
            <h1 className="text-[48px] leading-tight mt-4 text-[#294D3A]">{book.title}</h1>
            {book.author && <div className="text-[22px] italic mt-2">{book.author}</div>}
            {book.span && <div className="text-[18px] text-[#6A6A6A] mt-6">{book.span}</div>}
          </section>

          {/* Contents: each line opens its page */}
          <section className={`book-page${off(1)}`}>
            <h2 className="text-[28px] text-[#294D3A] mb-3">Contents</h2>
            <ol className="text-[17px] space-y-1">
              {book.years.map((y, i) => <li key={y.year}><button type="button" onClick={() => setPage(yearPage(i))} className="underline-offset-4 hover:underline">{y.year}</button></li>)}
              {book.chapters.length > 0 && <li><button type="button" onClick={() => setPage(chaptersPage)} className="underline-offset-4 hover:underline">Chapters of my life</button></li>}
              {book.growing && <li><button type="button" onClick={() => setPage(growingPage)} className="underline-offset-4 hover:underline">What I'm growing toward</button></li>}
            </ol>
            {book.years.length === 0 && <p className="text-[17px] italic text-[#6A6A6A] mt-4">Nothing to include yet with these choices. Keep living, and keeping, and your story will fill these pages.</p>}
          </section>

          {book.years.map((y, i) => (
            <section key={y.year} className={`book-page${off(yearPage(i))}`}>
              <h2 className="text-[40px] text-[#294D3A] leading-none">{y.year}</h2>

              {y.seasons.map(s => (
                <p key={s.id} className="text-[19px] italic text-[#456A54] mt-3">{s.name}{s.blurb ? ` — ${s.blurb}` : ""}</p>
              ))}

              {y.trips.length > 0 && (
                <>
                  <Heading>Where I went</Heading>
                  {y.countries.length > 0 && <p className="text-[15px] text-[#6A6A6A] mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>{y.countries.join(" · ")}</p>}
                  {y.trips.map(t => (
                    <div key={t.title} className="mb-2 text-[17px]">
                      {tripLine(t) === t.title
                        ? <span className="font-semibold">{t.title}</span>
                        : <><span className="font-semibold">{t.title}</span>: {t.places.map(p => p.name).join(", ")}</>}
                      {t.places.filter(p => p.note).map(p => (
                        <div key={p.name} className="text-[15px] italic text-[#6A6A6A] ml-4">{p.name}: {p.note}</div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              {y.dreams.length > 0 && (
                <>
                  <Heading>Dreams I lived</Heading>
                  <ul className="text-[17px] list-disc ml-5">{y.dreams.map(d => <li key={d}>{d}</li>)}</ul>
                </>
              )}

              {y.flow.length > 0 && (
                <>
                  <Heading>Through the year</Heading>
                  {y.flow.map(f => f.kind === "memory" ? (
                    <figure key={"m" + f.title + f.date} className="mb-6 book-keep">
                      {f.photo && <img src={f.photo} alt="" className="w-full max-h-[340px] object-cover rounded-sm mb-2" />}
                      {f.morePhotos?.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {f.morePhotos.map(u => <img key={u} src={u} alt="" className="w-full aspect-square object-cover rounded-sm" />)}
                        </div>
                      )}
                      <figcaption>
                        <div className="text-[19px] font-semibold">{f.title}</div>
                        <div className="text-[14px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>{niceDate(f.date)}{f.place ? ` · ${f.place}` : ""}</div>
                        {f.text && <p className="text-[17px] mt-1 whitespace-pre-wrap">{f.text}</p>}
                      </figcaption>
                    </figure>
                  ) : f.kind === "words" ? (
                    <blockquote key={"w" + f.date + f.lines[0].slice(0, 24)} className="mb-6 text-center px-4">
                      {f.lines.map((line, i) => (
                        <div key={i} className="book-keep">
                          {i > 0 && <div className="text-[#C9A24D] text-[13px] my-2" aria-hidden="true">✦</div>}
                          <p className="text-[19px] italic leading-snug whitespace-pre-wrap m-0">“{line}”</p>
                        </div>
                      ))}
                      <div className="text-[13px] text-[#6A6A6A] mt-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
                        From my YOUrnal · {niceDate(f.date)}
                      </div>
                    </blockquote>
                  ) : (
                    <blockquote key={"h" + f.date} className="border-l-2 border-[#C9A24D] pl-3 mb-6 book-keep">
                      <p className="text-[17px] italic">{f.note}</p>
                      <div className="text-[13px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>From my harvest · week of {niceDate(f.date)}</div>
                    </blockquote>
                  ))}
                </>
              )}
            </section>
          ))}

          {book.chapters.length > 0 && (
            <section className={`book-page${off(chaptersPage)}`}>
              <h2 className="text-[32px] text-[#294D3A]">Chapters of my life</h2>
              {book.chapters.map(c => (
                <div key={c.title + c.from} className="mt-4 book-keep">
                  <div className="text-[22px] font-semibold">{c.title}</div>
                  <div className="text-[14px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>{niceDate(c.from)} – {c.to ? niceDate(c.to) : "now"}</div>
                  {c.blurb && <p className="text-[17px] italic mt-1">{c.blurb}</p>}
                  {c.moments.length > 0 && <p className="text-[15px] text-[#6A6A6A] mt-1">{c.moments.join(" · ")}</p>}
                </div>
              ))}
            </section>
          )}

          {book.growing && (
            <section className={`book-page${off(growingPage)}`}>
              <h2 className="text-[32px] text-[#294D3A]">What I'm growing toward</h2>
              {book.growing.values.length > 0 && (
                <>
                  <Heading>My values</Heading>
                  {book.growing.values.map(v => (
                    <p key={v.name} className="text-[17px] mb-1.5"><span className="font-semibold">{v.name}</span>{v.meaning ? `: ${v.meaning}` : ""}</p>
                  ))}
                </>
              )}
              {book.growing.visions.length > 0 && (
                <>
                  <Heading>Who I'm becoming</Heading>
                  {book.growing.visions.map(v => (
                    <p key={v.title} className="text-[17px] mb-1.5"><span className="font-semibold">{v.title}</span>: {v.statement}</p>
                  ))}
                </>
              )}
              {book.growing.dreams.length > 0 && (
                <>
                  <Heading>Dreams still ahead</Heading>
                  <ul className="text-[17px] list-disc ml-5">{book.growing.dreams.map(d => <li key={d}>{d}</li>)}</ul>
                </>
              )}
            </section>
          )}

          <footer className={`text-center text-[13px] text-[#6A6A6A] mt-12${at === pageCount - 1 ? "" : " book-off"}`} style={{ fontFamily: "DM Sans, sans-serif" }}>
            Kept in YOU · {book.made}
          </footer>
        </article>

        {/* Turning the pages (never printed) */}
        <nav className="book-turn no-print max-w-[640px] mx-auto flex items-center justify-between gap-3 px-5 py-4 mb-10" aria-label="Pages">
          <button type="button" onClick={() => turn(-1)} disabled={at === 0} aria-label="Previous page" className="w-12 h-12 rounded-full bg-surface1 shadow-card flex items-center justify-center disabled:opacity-30">
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <span className="text-caption text-textMuted">Page {at + 1} of {pageCount} · swipe to turn</span>
          <button type="button" onClick={() => turn(1)} disabled={at === pageCount - 1} aria-label="Next page" className="w-12 h-12 rounded-full bg-forestAccent text-onAccent shadow-card flex items-center justify-center disabled:opacity-30">
            <ChevronRight size={22} strokeWidth={1.75} />
          </button>
        </nav>
        </>
      )}
    </div>
  );
}
