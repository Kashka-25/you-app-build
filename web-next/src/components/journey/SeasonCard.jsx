import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { GlowBubble } from "../ui/GlowBubble";

function niceWeek(dateKey) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// The season you seem to be in, read from your recent Harvests: the notes
// you kept and what you carried, rested and released. Read only when you
// ask (with AI consent), and always shown with what it was read from.
export default function SeasonCard() {
  const { currentSeason: season, weekHarvests, readSeason } = useAppData();
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
      if (e?.code !== "consent_declined") setMessage("Your season couldn't be read just now. Try again later.");
    }
    setReading(false);
  }

  const based = season?.based_on || {};
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-5 flex items-start gap-3">
      <GlowBubble icon={Sparkles} size={40} />
      <div className="flex-1 min-w-0">
        <div className="text-label uppercase text-textMuted mb-1">Your season</div>
        {season ? (
          <>
            <div className="font-serif text-h3 text-gold">{season.name}</div>
            {season.blurb && <div className="text-bodySm text-textSecondary mt-1">{season.blurb}</div>}
            {season.signals?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {season.signals.map(sig => (
                  <span key={sig} className="text-caption bg-surface3 text-textSecondary px-2 py-0.5 rounded-full">{sig}</span>
                ))}
              </div>
            )}
            <div className="text-caption text-textMuted mt-2">
              Read from {based.harvests} {based.harvests === 1 ? "harvest" : "harvests"}
              {based.from && ` · ${niceWeek(based.from)} – ${niceWeek(based.to)}`}
              {" · "}
              <button onClick={read} disabled={reading} className="underline underline-offset-2 disabled:opacity-60">
                {reading ? "Reading…" : "Read it again"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-bodySm text-textSecondary">
              Your season is read from your weekly Harvests: the notes you keep, and what you carry forward, rest or release.
            </div>
            {weekHarvests.length > 0 ? (
              <button onClick={read} disabled={reading} className="mt-2 text-bodySm text-forestAccent font-medium disabled:opacity-60">
                {reading ? "Reading your harvests…" : `Read my season (${weekHarvests.length} ${weekHarvests.length === 1 ? "harvest" : "harvests"})`}
              </button>
            ) : (
              <div className="text-caption text-textMuted mt-2">Gather your first weekly Harvest and your season can be read from it.</div>
            )}
            <div className="text-caption text-textMuted mt-1">You'll be asked before anything is sent to AI.</div>
          </>
        )}
        {message && <div className="text-caption text-textSecondary mt-2">{message}</div>}
      </div>
    </div>
  );
}
