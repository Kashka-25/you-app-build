import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, Lock } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { goBack } from "../../lib/week";
import { SECTIONS, buildStory, storyToMarkdown, niceDate, tripLine } from "../../lib/myStory";
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
    <div className="min-h-dvh bg-bg font-sans my-story">
      {/* Controls: never printed. */}
      <div className="no-print max-w-[640px] mx-auto px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <button onClick={() => goBack(navigate)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary mb-5">
          <ArrowLeft size={16} strokeWidth={1.75} /> Back
        </button>
        <div className="text-label uppercase text-gold mb-1">Legacy</div>
        <h1 className="font-serif text-hero text-textPrimary">My Story</h1>
        <p className="text-bodySm text-textSecondary mt-1 mb-4">
          Your life so far, as a book, made only from what you've kept, in your own words.
        </p>

        <div className="rounded-card bg-surface1 shadow-card p-4">
          <div className="text-label uppercase text-textMuted mb-2">What goes in</div>
          <div className="flex flex-wrap gap-1.5">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                role="switch"
                aria-checked={include[s.key]}
                onClick={() => setInclude(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
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
            Put together on this device and never uploaded. Journal entries start switched off because they're the most private.
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Button icon={Printer} onClick={() => window.print()} disabled={!book}>Print or save as PDF</Button>
            <Button variant="secondary" icon={Download} onClick={download} disabled={!book}>Download text</Button>
          </div>
        </div>
        <div className="text-label uppercase text-textMuted mt-6">Preview</div>
      </div>

      {!book ? (
        <div className="no-print max-w-[640px] mx-auto px-5 text-body text-textSecondary">Gathering your story…</div>
      ) : (
        <article className="book max-w-[640px] mx-auto bg-[#FFFDF9] text-[#2B2B2B] shadow-card sm:rounded-card px-8 py-10 mb-12" style={{ fontFamily: "Cormorant Garamond, Georgia, serif" }}>
          {/* Cover */}
          <section className="book-cover text-center py-16">
            <div className="text-[13px] tracking-[0.2em] uppercase text-[#C9A24D]" style={{ fontFamily: "DM Sans, sans-serif" }}>Kept in YOU</div>
            <h1 className="text-[48px] leading-tight mt-4 text-[#294D3A]">{book.title}</h1>
            {book.author && <div className="text-[22px] italic mt-2">{book.author}</div>}
            {book.span && <div className="text-[18px] text-[#6A6A6A] mt-6">{book.span}</div>}
          </section>

          {/* Contents */}
          <section className="book-page">
            <h2 className="text-[28px] text-[#294D3A] mb-3">Contents</h2>
            <ol className="text-[17px] space-y-1">
              {book.years.map(y => <li key={y.year}>{y.year}</li>)}
              {book.chapters.length > 0 && <li>Chapters of my life</li>}
              {book.growing && <li>What I'm growing toward</li>}
            </ol>
            {book.years.length === 0 && <p className="text-[17px] italic text-[#6A6A6A] mt-4">Nothing to include yet with these choices. Keep living, and keeping, and your story will fill these pages.</p>}
          </section>

          {book.years.map(y => (
            <section key={y.year} className="book-page">
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

              {y.moments.length > 0 && (
                <>
                  <Heading>Memories</Heading>
                  {y.moments.map(m => (
                    <figure key={m.title + m.date} className="mb-5 book-keep">
                      {m.photo && <img src={m.photo} alt="" className="w-full max-h-[340px] object-cover rounded-sm mb-2" />}
                      {m.morePhotos?.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {m.morePhotos.map(u => <img key={u} src={u} alt="" className="w-full aspect-square object-cover rounded-sm" />)}
                        </div>
                      )}
                      <figcaption>
                        <div className="text-[19px] font-semibold">{m.title}</div>
                        <div className="text-[14px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>{niceDate(m.date)}{m.place ? ` · ${m.place}` : ""}</div>
                        {m.text && <p className="text-[17px] mt-1 whitespace-pre-wrap">{m.text}</p>}
                      </figcaption>
                    </figure>
                  ))}
                </>
              )}

              {y.harvests.length > 0 && (
                <>
                  <Heading>From my harvests</Heading>
                  {y.harvests.map(h => (
                    <blockquote key={h.week} className="border-l-2 border-[#C9A24D] pl-3 mb-3 book-keep">
                      <p className="text-[17px] italic">{h.note}</p>
                      <div className="text-[13px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>Week of {niceDate(h.week)}</div>
                    </blockquote>
                  ))}
                </>
              )}

              {y.journal.length > 0 && (
                <>
                  <Heading>From my journal</Heading>
                  {y.journal.map(j => (
                    <div key={j.date + j.text.slice(0, 20)} className="mb-4 book-keep">
                      <div className="text-[14px] text-[#6A6A6A]" style={{ fontFamily: "DM Sans, sans-serif" }}>{niceDate(j.date)}{j.place ? ` · ${j.place}` : ""}</div>
                      <p className="text-[17px] whitespace-pre-wrap">{j.text}</p>
                    </div>
                  ))}
                </>
              )}
            </section>
          ))}

          {book.chapters.length > 0 && (
            <section className="book-page">
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
            <section className="book-page">
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

          <footer className="text-center text-[13px] text-[#6A6A6A] mt-12" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Kept in YOU · {book.made}
          </footer>
        </article>
      )}
    </div>
  );
}
