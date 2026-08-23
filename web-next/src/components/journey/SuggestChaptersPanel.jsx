import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";

const MIN_MOMENTS = 3;

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuggestChaptersPanel() {
  const { moments, suggestChapters, saveChapters } = useAppData();
  const [suggestions, setSuggestions] = useState(null); // null = no pending review
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function runSuggest() {
    setLoading(true);
    setError("");
    try {
      const result = await suggestChapters();
      setSuggestions(result);
    } catch (e) {
      console.error("[SuggestChaptersPanel] suggest failed:", e);
      setError("Couldn't get suggestions right now — check the Edge Function is deployed and try again.");
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

  if (moments.length < MIN_MOMENTS) {
    return (
      <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 mb-5 text-bodySm text-textMuted">
        Add {MIN_MOMENTS - moments.length} more {MIN_MOMENTS - moments.length === 1 ? "memory" : "memories"} to unlock AI-suggested chapters.
      </div>
    );
  }

  if (suggestions) {
    return (
      <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
        <div className="text-label uppercase text-gold mb-3">Suggested chapters — review before saving</div>
        {suggestions.map((c, i) => (
          <div key={i} className="mb-3 pb-3 border-b border-borderC last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-serif text-h3 text-textPrimary">{c.title}</div>
              <span className="text-caption text-textMuted flex-none">{niceDate(c.range_start)} – {niceDate(c.range_end)}</span>
            </div>
            <div className="text-bodySm text-textSecondary mt-1">{c.blurb}</div>
            <div className="text-caption text-textMuted mt-1">{(c.moment_titles || []).length} moments</div>
          </div>
        ))}
        {error && <div className="text-bodySm text-red-500 mt-2 mb-2">{error}</div>}
        <div className="flex gap-3 mt-3">
          <Button variant="secondary" className="flex-1" onClick={() => setSuggestions(null)} disabled={saving}>Discard</Button>
          <Button variant="primary" className="flex-1" onClick={accept} disabled={saving}>
            {saving ? "Saving…" : "Save these chapters"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <Button variant="secondary" icon={Sparkles} onClick={runSuggest} disabled={loading}>
        {loading ? "Reading your timeline…" : "Suggest chapters with AI"}
      </Button>
      {error && <div className="text-bodySm text-red-500 mt-2">{error}</div>}
    </div>
  );
}
