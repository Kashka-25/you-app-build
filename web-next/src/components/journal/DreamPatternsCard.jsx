import { useEffect, useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { AiButton, AiCard, AiLabel, AiLink } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";
import { Guide } from "../ui/Guide";

function niceDate(dateKey) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// Patterns across every dream you've recorded (Cassidy, Oct 27), shown at
// the top of the YOUrnal when the #dream tag is open. Read only when you
// ask, kept until you ask again.
export default function DreamPatternsCard({ dreamCount }) {
  const { loadDreamPatterns, readDreamPatterns } = useAppData();
  const [patterns, setPatterns] = useState(null);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let live = true;
    loadDreamPatterns().then(p => { if (live) setPatterns(p); });
    return () => { live = false; };
  }, []);

  async function read() {
    setReading(true);
    setMessage("");
    try {
      const result = await readDreamPatterns();
      if (result.empty) setMessage(result.message);
      else setPatterns(result.patterns);
    } catch (e) {
      console.error("[DreamPatternsCard] read failed:", e);
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "Your dreams couldn't be read just now. Try again later.");
    }
    setReading(false);
  }

  const r = patterns?.reading;
  const newSince = patterns ? Math.max(0, dreamCount - patterns.dream_count) : 0;
  return (
    <AiCard className="mb-4">
      <div className="mb-1.5"><AiLabel>Patterns in your dreams</AiLabel></div>
      {r ? (
        <>
          <div className="text-bodySm text-[var(--ai-text)]">{r.overview}</div>

          {r.recurring_symbols?.length > 0 && (
            <Section title="What keeps returning">
              {r.recurring_symbols.map(s => (
                <div key={s.symbol} className="mb-2.5">
                  <div className="text-bodySm">
                    <span className="ai-gold-text font-medium">{s.symbol}</span>
                    <span className="text-caption text-[var(--ai-text-2)]"> · in {s.count} {s.count === 1 ? "dream" : "dreams"}</span>
                  </div>
                  <div className="text-bodySm text-[var(--ai-text)]">{s.meaning}</div>
                </div>
              ))}
            </Section>
          )}

          {r.recurring_feelings?.length > 0 && (
            <Section title="Feelings that return">
              {r.recurring_feelings.map(f => (
                <div key={f.feeling} className="text-bodySm text-[var(--ai-text)] mb-1.5">
                  <span className="ai-gold-text font-medium">{f.feeling}</span> · {f.note}
                </div>
              ))}
            </Section>
          )}

          {r.threads?.length > 0 && (
            <Section title="Threads over time">
              {r.threads.map(t => (
                <div key={t.title} className="mb-2">
                  <div className="text-bodySm ai-gold-text font-medium">{t.title}</div>
                  <div className="text-bodySm text-[var(--ai-text)]">{t.text}</div>
                </div>
              ))}
            </Section>
          )}

          {r.waking_life?.length > 0 && (
            <Section title="Where it may touch your days">
              {r.waking_life.map(w => <div key={w} className="text-bodySm text-[var(--ai-text)] mb-1.5">{w}</div>)}
            </Section>
          )}

          {r.question && <div className="font-serif text-body ai-gold-text mt-3 italic">{r.question}</div>}

          <div className="text-caption text-[var(--ai-text-2)] mt-3">
            Read from {patterns.dream_count} dreams
            {patterns.first_dream && ` · ${niceDate(patterns.first_dream)} – ${niceDate(patterns.last_dream)}`}
            {newSince > 0 && ` · ${newSince} new since`}
            {" · "}
            <AiLink onClick={read} disabled={reading}>{reading ? "Reading…" : "Read them again"}</AiLink>
          </div>
        </>
      ) : (
        <>
          <div className="text-bodySm text-[var(--ai-text)]">Look across every dream you've recorded for what keeps returning.</div>
          <Guide className="mt-0.5">
            Symbols, feelings and threads that show up in more than one dream, held lightly. You'll be asked before anything is sent to AI.
          </Guide>
          <AiButton size="sm" onClick={read} busy={reading} className="mt-2">
            {reading ? "Reading your dreams…" : `Read my ${dreamCount} dreams`}
          </AiButton>
        </>
      )}
      {message && <div className="text-caption text-[var(--ai-text-2)] mt-2">{message}</div>}
      <DrawsFrom uses={["journal", "pursuits", "values"]} className="mt-2" />
    </AiCard>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-3">
      <div className="text-label uppercase tracking-[0.12em] text-[var(--ai-text-2)] mb-1.5">{title}</div>
      {children}
    </div>
  );
}
