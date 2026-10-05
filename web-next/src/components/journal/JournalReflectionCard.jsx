import { useEffect, useState } from "react";
import { Sparkles, Check, X, Pencil, Highlighter } from "lucide-react";
import KeepHighlight from "./KeepHighlight";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import { AiButton, AiCard, AiLabel, AiLink } from "../ui/Premium";

const CATEGORY_LABELS = {
  theme: "Theme", emotion: "Emotion", value: "Value", dream: "Dream", goal: "Goal",
  challenge: "Challenge", achievement: "Achievement", relationship: "Relationship",
  event: "Event", life_area: "Life area", question: "Question", pattern: "Pattern"
};

const CONNECTION_LABELS = {
  values: "Values", goals: "Goals", dreams: "Dreams", challenges: "Challenges",
  life_areas: "Life areas", moments: "Memories", chapters: "Life chapters", related_entries: "Earlier entries"
};

// One AI-suggested insight item. Never disappears on its own — editing
// marks it "edited", rejecting marks it "rejected" (hidden here, kept in
// the row) so what the AI proposed is never silently rewritten as fact.
function InsightItem({ item, onEdit, onReject }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);

  if (item.status === "rejected") return null;

  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-caption uppercase text-textMuted flex-none w-[84px] pt-0.5">
        {CATEGORY_LABELS[item.category] || item.category}
      </span>
      {editing ? (
        <div className="flex-1 flex items-center gap-1.5">
          <input
            autoFocus
            className="flex-1 bg-surface2 border border-borderC rounded-sm px-2 py-1 text-bodySm text-textPrimary outline-none focus:border-forestAccent"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { onEdit(text); setEditing(false); }
              if (e.key === "Escape") { setText(item.text); setEditing(false); }
            }}
          />
          <button onClick={() => { onEdit(text); setEditing(false); }} aria-label="Save edit">
            <Check size={14} strokeWidth={2} className="text-forestAccent" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-start justify-between gap-2">
          <span className="text-bodySm text-textPrimary">
            {item.text}
            {item.status === "edited" && <span className="text-caption text-textMuted"> (edited)</span>}
          </span>
          <div className="flex items-center gap-1.5 flex-none pt-0.5">
            <button onClick={() => { setText(item.text); setEditing(true); }} aria-label="Edit this">
              <Pencil size={13} strokeWidth={1.75} className="text-textMuted hover:text-textPrimary" />
            </button>
            <button onClick={onReject} aria-label="Not quite right — remove">
              <X size={14} strokeWidth={1.75} className="text-textMuted hover:text-red-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Shown inside JournalEntryModal once an entry has been saved. Offers an
// optional, editable, rejectable AI reflection — never generated
// automatically, always the user's call (see reflect-on-journal-entry Edge
// Function for the "mirror, not authority" system prompt this renders).
export default function JournalReflectionCard({ entryId }) {
  const { journalInsights, loadJournalInsight, generateJournalReflection, updateInsightItem, journalEntries, highlights, addHighlight } = useAppData();
  const [keeping, setKeeping] = useState(null);
  const entry = journalEntries.find(e => e.id === entryId);
  const isKept = text => highlights.some(h => h.entry_id === entryId && h.text.trim() === text.trim());
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const insight = journalInsights[entryId];

  useEffect(() => {
    setChecked(false);
  }, [entryId]);

  useEffect(() => {
    if (!entryId || checked) return;
    setChecked(true);
    loadJournalInsight(entryId).catch(e => console.error("[JournalReflectionCard] load failed:", e));
  }, [entryId, checked, loadJournalInsight]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      await generateJournalReflection(entryId);
    } catch (e) {
      // "Not now" on the consent prompt isn't a failure — say nothing.
      if (e?.code !== "consent_declined") {
        console.error("[JournalReflectionCard] generate failed:", e);
        setError(e?.friendly || "Couldn't get a reflection right now. Try again in a little while.");
      }
    }
    setLoading(false);
  }

  const visibleItems = (insight?.insights || []).filter(i => i.status !== "rejected");
  const connections = insight?.connections || {};
  const hasConnections = Object.values(connections).some(v => Array.isArray(v) && v.length > 0);

  return (
    <AiCard className="mt-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <AiLabel>Reflection</AiLabel>
        {insight && (
          <AiLink onClick={generate} disabled={loading}>{loading ? "Regenerating…" : "Regenerate"}</AiLink>
        )}
      </div>

      {!insight ? (
        <>
          <div className="text-bodySm text-textMuted mb-3">
            YOU can offer a gentle, optional reflection on this entry — themes it noticed, a question to sit with. Always your call, and you can edit or remove anything it suggests.
          </div>
          <AiButton size="sm" onClick={generate} busy={loading}>
            {loading ? "Reflecting…" : "Get a reflection"}
          </AiButton>
        </>
      ) : (
        <>
          {insight.summary && <div className="text-bodySm text-textSecondary italic mb-3">{insight.summary}</div>}

          {visibleItems.length > 0 && (
            <div className="mb-3 divide-y divide-borderC/60">
              {visibleItems.map(item => (
                <InsightItem
                  key={item.id}
                  item={item}
                  onEdit={text => updateInsightItem(entryId, item.id, { text, status: "edited" })}
                  onReject={() => updateInsightItem(entryId, item.id, { status: "rejected" })}
                />
              ))}
            </div>
          )}

          {hasConnections && (
            <div className="mb-3">
              <div className="text-label uppercase text-textMuted mb-1">Possible connections</div>
              {Object.entries(connections).map(([key, list]) =>
                Array.isArray(list) && list.length > 0 ? (
                  <div key={key} className="text-bodySm text-textSecondary mb-0.5">
                    <span className="text-textMuted">{CONNECTION_LABELS[key] || key}: </span>
                    {list.join(", ")}
                  </div>
                ) : null
              )}
            </div>
          )}

          {insight.reflection_question && (
            <div className="mb-2">
              <div className="text-label uppercase text-textMuted mb-1">A question to sit with</div>
              <div className="text-bodySm text-textPrimary">{insight.reflection_question}</div>
            </div>
          )}

          {(insight.highlights || []).length > 0 && (
            <div className="mb-3">
              <div className="text-label uppercase text-textMuted mb-1.5">Moments worth keeping</div>
              <div className="space-y-2">
                {insight.highlights.map(text => (
                  keeping === text ? (
                    <KeepHighlight
                      key={text}
                      text={text}
                      entryTags={entry?.tags || []}
                      onKeep={async f => { await addHighlight({ ...f, entryId, entryDate: entry?.entry_date }); setKeeping(null); }}
                      onCancel={() => setKeeping(null)}
                    />
                  ) : (
                    <div key={text} className="flex items-start gap-2.5">
                      <div className="flex-1 font-serif italic text-[16px] leading-snug text-textPrimary">“{text}”</div>
                      {isKept(text) ? (
                        <span className="flex-none text-caption text-[#E8C877] flex items-center gap-1 mt-1"><Check size={13} strokeWidth={2} /> Kept</span>
                      ) : (
                        <button type="button" onClick={() => setKeeping(text)} className="flex-none flex items-center gap-1 min-h-[36px] px-2.5 rounded-full border border-[#C9A24D]/60 text-caption text-[#F3DE9C]">
                          <Highlighter size={13} strokeWidth={1.75} /> Keep
                        </button>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {insight.suggested_next_step && (
            <div>
              <div className="text-label uppercase text-textMuted mb-1">Possible next step</div>
              <div className="text-bodySm text-textPrimary">{insight.suggested_next_step}</div>
            </div>
          )}
        </>
      )}

      {error && <div className="text-bodySm text-[#F0A3A3] mt-2">{error}</div>}
    </AiCard>
  );
}
