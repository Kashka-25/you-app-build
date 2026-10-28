import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { GlowBubble } from "../ui/GlowBubble";
import { AiButton, AiCard, AiLabel, AiLink } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";
import LookBack from "./LookBack";
import { Guide } from "../ui/Guide";

function niceWeek(dateKey) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// The season you seem to be in, read from the last ten weeks of everything
// you allow the AI to read: Harvests, YOUrnal, Moments, and (if allowed)
// your compass and mood. Read only when you ask (with AI consent), and
// always shown with what it was read from.

// "4 harvests, 12 entries and 2 moments"
function readFrom(based) {
  const parts = [
    based.harvests ? `${based.harvests} ${based.harvests === 1 ? "harvest" : "harvests"}` : null,
    based.entries ? `${based.entries} ${based.entries === 1 ? "entry" : "entries"}` : null,
    based.moments ? `${based.moments} ${based.moments === 1 ? "moment" : "moments"}` : null
  ].filter(Boolean);
  if (parts.length < 2) return parts[0] || "your recent weeks";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
export default function SeasonCard() {
  const { currentSeason: season, readSeason } = useAppData();
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");

  async function read() {
    setReading(true);
    setMessage("");
    try {
      const result = await readSeason();
      if (result?.empty) setMessage(result.message);
    } catch (e) {
      console.error("[SeasonCard] readSeason failed:", e);
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "Your season couldn't be read just now. Try again later.");
    }
    setReading(false);
  }

  const based = season?.based_on || {};
  return (
    <AiCard className="mb-5">
      <div className="min-w-0">
        <div className="mb-1.5"><AiLabel>Your season</AiLabel></div>
        {season ? (
          <>
            <div className="font-serif text-h2 ai-gold-text">{season.name}</div>
            {season.blurb && <div className="text-bodySm text-textSecondary mt-1">{season.blurb}</div>}
            {season.signals?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {season.signals.map(sig => (
                  <span key={sig} className="text-caption bg-surface3 text-textSecondary px-2 py-0.5 rounded-full">{sig}</span>
                ))}
              </div>
            )}
            <div className="text-caption text-textMuted mt-2">
              Read from {readFrom(based)}
              {based.from && ` · ${niceWeek(based.from)} – ${niceWeek(based.to)}`}
              {" · "}
              <AiLink onClick={read} disabled={reading}>{reading ? "Reading…" : "Read it again"}</AiLink>
            </div>
          </>
        ) : (
          <>
            <div className="text-bodySm text-textSecondary">The feel of your last ten weeks.</div>
            <Guide className="mt-0.5">
              Your season is read from what you lived and wrote: your weekly Harvests (the notes you keep, and what you carried forward, rested or released), your YOUrnal and your Moments. Your compass and mood can add a little colour. You'll be asked before anything is sent to AI.
            </Guide>
            <AiButton size="sm" onClick={read} busy={reading} className="mt-2">
              {reading ? "Reading your weeks…" : "Read my season"}
            </AiButton>
          </>
        )}
        <DrawsFrom uses={["harvests", "journal", "moments", "values", "mood"]} className="mt-2" />
        <LookBack />
        {message && <div className="text-caption text-textSecondary mt-2">{message}</div>}
      </div>
    </AiCard>
  );
}
