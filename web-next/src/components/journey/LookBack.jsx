import { useState } from "react";
import { Link } from "react-router-dom";
import { History, Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { latestReview, niceRange, useHemisphere } from "../../lib/seasons";
import { localDateKey } from "../../lib/week";
import { AiButton } from "../ui/Premium";

const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateKey(d);
};
const tomorrow = () => daysAgo(-1);

const SPANS = [
  { key: "2w", label: "2 weeks", from: () => daysAgo(14) },
  { key: "1m", label: "A month", from: () => daysAgo(30) },
  { key: "3m", label: "3 months", from: () => daysAgo(91) }
];

// Under Your Season: the way into the latest Season review, any time, and
// Look back (Cassidy, Oct 28): a reflection on demand over the last two
// weeks, a month, three months, or since a date you choose.
export default function LookBack() {
  const { readSeason } = useAppData();
  const { hemisphere } = useHemisphere();
  const review = latestReview(hemisphere);
  const [span, setSpan] = useState("2w");
  const [since, setSince] = useState("");
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  async function read() {
    const from = span === "date" ? since : SPANS.find(s => s.key === span).from();
    if (!from) return setMessage("Choose a date first.");
    setReading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await readSeason({ from, to: tomorrow(), kind: "lookback", title: `Look back from ${from}` });
      if (res?.empty) setMessage(res.message);
      else setResult(res.season);
    } catch (e) {
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "Couldn't look back just now. Try again later.");
    }
    setReading(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--gold)_25%,transparent)]">
      <Link to="/season-review" className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 bg-surface2 hover:bg-surface3 mb-4">
        <Sparkles size={16} strokeWidth={1.75} className="text-gold flex-none" />
        <span className="flex-1 min-w-0">
          <span className="block text-bodySm text-textPrimary font-medium">{review.title}</span>
          <span className="block text-caption text-textMuted">{niceRange(review.from, review.to)}</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 mb-1.5">
        <History size={15} strokeWidth={1.75} className="text-gold" />
        <span className="text-bodySm text-textPrimary font-medium">Look back</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2" role="radiogroup" aria-label="How far back">
        {[...SPANS, { key: "date", label: "Since…" }].map(s => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={span === s.key}
            onClick={() => setSpan(s.key)}
            className={`min-h-[32px] px-3 rounded-full text-caption border ${span === s.key ? "border-forestAccent bg-forestAccent text-onAccent" : "border-borderC text-textSecondary"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {span === "date" && (
        <input
          type="date"
          value={since}
          max={localDateKey()}
          onChange={e => setSince(e.target.value)}
          aria-label="Look back since"
          className="mb-2 bg-surface1 border border-borderC rounded-sm px-3 py-2 text-bodySm text-textPrimary"
        />
      )}
      <AiButton size="sm" onClick={read} busy={reading}>
        {reading ? "Looking back…" : "Look back"}
      </AiButton>
      {message && <div className="text-caption text-textSecondary mt-2">{message}</div>}
      {result && (
        <div className="mt-3 rounded-sm bg-surface2 p-3">
          <div className="font-serif text-h3 ai-gold-text">{result.name}</div>
          {result.blurb && <div className="text-bodySm text-textSecondary mt-1">{result.blurb}</div>}
          {result.based_on?.review?.grew && <div className="text-bodySm text-textPrimary mt-2"><b className="font-medium">What grew:</b> {result.based_on.review.grew}</div>}
          {result.based_on?.review?.carry && <div className="text-bodySm text-textPrimary mt-1"><b className="font-medium">Carry forward:</b> {result.based_on.review.carry}</div>}
        </div>
      )}
    </div>
  );
}
