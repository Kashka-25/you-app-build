import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { AiButton } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";


function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuggestChaptersPanel() {
  const { moments, suggestChapters, saveChapters } = useAppData();
  const [suggestions, setSuggestions] = useState(null); // null = no pending review
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function runSuggest() {
    setLoading(true);
    setError("");
    setNote("");
    try {
      const result = await suggestChapters();
      if (result.chapters.length) setSuggestions(result.chapters);
      else setNote(result.message || "There isn't enough yet to find chapters in.");
    } catch (e) {
      // "Not now" on the consent prompt isn't a failure — say nothing.
      if (e?.code !== "consent_declined") {
        console.error("[SuggestChaptersPanel] suggest failed:", e);
        setError(e?.friendly || "Couldn't get suggestions right now. Try again in a little while.");
      }
    }
    setLoading(false);
  }

  async function accept() {
    setSaving(true);
    try {
      await saveChapters(suggestions);
      setSuggestions(null);
    } catch (e) {
      console.error("[SuggestChaptersPanel] save failed:", e);
      setError("Couldn't save those chapters — try again.");
    }
    setSaving(false);
  }

  if (suggestions) {
    return (
      <div className="mt-3">
        <div className="text-label uppercase text-[#E8C877] mb-3">Suggested chapters — review before saving</div>
        {suggestions.map((c, i) => (
          <div key={i} className="mb-3 pb-3 border-b border-white/10 last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-serif text-h3 ai-gold-text">{c.title}</div>
              <span className="text-caption text-[var(--ai-text-3)] flex-none">{niceDate(c.range_start)} – {niceDate(c.range_end)}</span>
            </div>
            <div className="text-bodySm text-[var(--ai-text-2)] mt-1">{c.blurb}</div>
            <div className="text-caption text-[var(--ai-text-3)] mt-1">{(c.moment_titles || []).length} moments</div>
          </div>
        ))}
        {error && <div className="text-bodySm text-red-500 mt-2 mb-2">{error}</div>}
        <div className="flex gap-3 mt-3">
          <button type="button" className="flex-1 min-h-[44px] rounded-sm bg-white/10 text-[var(--ai-text)] disabled:opacity-40" onClick={() => setSuggestions(null)} disabled={saving}>Discard</button>
          <button type="button" className="flex-1 min-h-[44px] rounded-sm bg-[var(--ai-gold-2)] text-[var(--ai-ink)] font-medium disabled:opacity-40" onClick={accept} disabled={saving}>
            {saving ? "Saving…" : "Keep these chapters"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <AiButton size="sm" onClick={runSuggest} busy={loading}>
        {loading ? "Reading your story…" : "Suggest my chapters"}
      </AiButton>
      <DrawsFrom uses={["moments", "journal", "harvests", "pursuits"]} className="mt-1.5" />
      {note && <div className="text-bodySm text-[var(--ai-text-2)] mt-2">{note}</div>}
      {error && <div className="text-bodySm text-red-500 mt-2">{error}</div>}
    </div>
  );
}
