import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Pencil, Trash2, Wrench } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { toolProgress, niceDate } from "../../lib/arcana";
import { BackRow } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ArcanumIcon } from "./YOUniversity";
import OwnToolModal from "./OwnToolModal";

// The last four weeks as a strip of days, used or not. Words carry the
// meaning too, so it never relies on colour alone.
function UseStrip({ strip }) {
  return (
    <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5" aria-hidden="true">
      {strip.map(d => (
        <span
          key={d.key}
          title={niceDate(d.key)}
          className={`aspect-square rounded-full ${d.used ? "bg-forestAccent" : "border border-borderC"}`}
        />
      ))}
    </div>
  );
}

export default function OwnToolScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ownTools, loaded, toggleToolUsedToday, deleteOwnTool } = useAppData();
  const tool = ownTools.find(t => t.id === id);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  if (!tool) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        {loaded ? (
          <EmptyState icon={Wrench} title="Tool not found" description="It may have been removed from your Library." />
        ) : (
          <div className="text-body text-textSecondary mt-4">Loading…</div>
        )}
      </div>
    );
  }

  const p = toolProgress(tool);

  async function toggle() {
    setError("");
    try {
      await toggleToolUsedToday(tool.id);
    } catch (e) {
      console.error("[OwnTool] toggle failed:", e);
      setError("Couldn't save that. Check your connection and try again.");
    }
  }

  async function remove() {
    try {
      await deleteOwnTool(tool.id);
      navigate("/youniversity", { replace: true });
    } catch (e) {
      console.error("[OwnTool] delete failed:", e);
      setError("Couldn't remove it just now. Try again.");
    }
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex items-start gap-3 mt-4 mb-5">
        <ArcanumIcon icon={Wrench} own />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-h2 font-medium m-0">{tool.name}</h1>
          <div className="text-caption text-textMuted mt-0.5">
            Your own{tool.learned_from ? ` · from ${tool.learned_from}` : ""}
          </div>
        </div>
        <button onClick={() => setEditing(true)} aria-label="Edit tool" className="p-2 text-textMuted hover:text-textPrimary">
          <Pencil size={18} strokeWidth={1.75} />
        </button>
      </div>

      {tool.purpose && (
        <div className="mb-5">
          <div className="text-label uppercase text-gold mb-1.5">What it helps with</div>
          <div className="text-body text-textPrimary whitespace-pre-wrap">{tool.purpose}</div>
        </div>
      )}
      {tool.how && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
          <div className="text-label uppercase text-gold mb-1.5">How</div>
          <div className="text-body text-textPrimary whitespace-pre-wrap">{tool.how}</div>
        </div>
      )}

      <Button
        variant={p.usedToday ? "secondary" : "primary"}
        icon={p.usedToday ? Check : undefined}
        className="w-full mb-2"
        aria-pressed={p.usedToday}
        onClick={toggle}
      >
        {p.usedToday ? "Used today" : "I used this today"}
      </Button>
      {error && <div role="alert" className="text-bodySm text-red-500 mb-2">{error}</div>}

      <div className="mt-5 mb-6">
        <div className="text-label uppercase text-gold mb-1.5">Over time</div>
        <div className="text-bodySm text-textSecondary mb-3">
          {p.total
            ? `Used on ${p.total} day${p.total === 1 ? "" : "s"}, ${p.inWindow} in the last four weeks. Last: ${niceDate(p.last)}.`
            : "Each day you use it, mark it here, and you'll see it gather."}
        </div>
        <UseStrip strip={p.strip} />
      </div>

      <div className="border-t border-borderC pt-4">
        {confirm ? (
          <div className="flex gap-2.5">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirm(false)}>Keep it</Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={remove}>Yes, remove it</Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" icon={Trash2} className="w-full" onClick={() => setConfirm(true)}>
            Remove from Library
          </Button>
        )}
        <div className="text-caption text-textMuted text-center mt-2">Added {niceDate(tool.created_at)}</div>
      </div>

      <OwnToolModal open={editing} onClose={() => setEditing(false)} tool={tool} />
    </div>
  );
}
