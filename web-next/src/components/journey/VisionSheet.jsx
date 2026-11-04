import { useEffect, useState } from "react";
import { Pencil, Sprout } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useAppData } from "../../lib/AppDataContext";
import { PillarSymbol, pillarColor } from "../ui/Pillar";
import { horizonPhrase, visionItems, votesThisWeek } from "../../lib/visions";
import PursuitPicker from "./PursuitPicker";

// Everything a vision holds (Nov 4): its line, what the future-self journey
// gathered, and the pursuits that grow it, which can be changed here.
export default function VisionSheet({ vision, onClose, onEdit }) {
  const { items, memory, habitLogs, linkVisionItems } = useAppData();
  const [choosing, setChoosing] = useState(false);
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setChoosing(false);
    setError("");
    setPicked(vision?.item_ids || []);
  }, [vision?.id]);

  if (!vision) return <Modal open={false} onClose={onClose} title="" />;
  const j = vision.journey || {};
  const color = pillarColor(vision.category);
  const seeds = visionItems(vision, items);
  const votes = votesThisWeek(vision, items, memory, habitLogs);

  async function saveLinks() {
    setSaving(true);
    setError("");
    try {
      await linkVisionItems(vision.id, picked);
      setChoosing(false);
    } catch (e) {
      console.error("[VisionSheet] link failed:", e);
      setError("Couldn't save that. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <Modal open={Boolean(vision)} onClose={onClose} title={vision.title}>
      <div className="flex gap-3 items-start -mt-2 mb-4">
        <PillarSymbol pillar={vision.category} size={32} className="flex-none" />
        <div className="min-w-0">
          {vision.statement && <p className="font-serif italic text-body text-textSecondary m-0">{vision.statement}</p>}
          <div className="text-caption text-textMuted mt-0.5">
            {vision.category}{j.horizon && ` · ${horizonPhrase(j.horizon)} from when you wrote it`}
          </div>
        </div>
      </div>

      <Part label="Growing it" color={color}>
        {votes > 0 && <div className="text-bodySm font-medium mb-1.5" style={{ color }}>{votes} {votes === 1 ? "vote" : "votes"} this week</div>}
        {choosing ? (
          <>
            <PursuitPicker value={picked} onChange={setPicked} pillar={vision.category} />
            {error && <div className="text-bodySm text-red-500 mt-2">{error}</div>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => { setChoosing(false); setPicked(vision.item_ids || []); }}>Cancel</Button>
              <Button size="sm" onClick={saveLinks} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </>
        ) : (
          <>
            {seeds.length > 0 ? (
              <ul className="m-0 p-0 list-none space-y-1">
                {seeds.map(s => (
                  <li key={s.id} className="flex items-center gap-2 text-bodySm text-textPrimary">
                    <Sprout size={14} strokeWidth={1.75} style={{ color: pillarColor(s.cat) }} aria-hidden="true" /> {s.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-bodySm text-textMuted m-0">Every small action is a vote for who you're becoming. Choose the pursuits that grow this self.</p>
            )}
            <button type="button" onClick={() => setChoosing(true)} className="text-bodySm text-forestAccent font-medium mt-2 min-h-[36px]">
              {seeds.length ? "Change pursuits" : "Choose pursuits"}
            </button>
          </>
        )}
      </Part>

      {j.already && <Part label="Already a little true" color={color}><p className="text-body m-0">{j.already}</p></Part>}
      {j.day && <Part label="A day in your life" color={color}><p className="text-body m-0 whitespace-pre-line">{j.day}</p></Part>}
      {j.voices?.length > 0 && (
        <Part label="Through their eyes" color={color}>
          {j.voices.map((v, i) => (
            <div key={i} className="mb-2 last:mb-0">
              {v.who && <div className="text-caption font-medium text-textMuted">{v.who}</div>}
              {v.says && <p className="font-serif italic text-body m-0">"{v.says}"</p>}
            </div>
          ))}
        </Part>
      )}
      {j.letter && <Part label="A letter back" color={color}><p className="font-serif text-[17px] leading-relaxed m-0 whitespace-pre-line">{j.letter}</p></Part>}
      {(j.obstacle || j.plan) && (
        <Part label="When it gets hard" color={color}>
          {j.obstacle && <p className="text-body m-0">{j.obstacle}</p>}
          {j.plan && <p className="text-body m-0 mt-1"><span className="font-medium">I will </span>{j.plan.replace(/^i will\s*/i, "")}</p>}
        </Part>
      )}
      {vision.reflection && <Part label="More" color={color}><p className="text-body m-0 whitespace-pre-line">{vision.reflection}</p></Part>}

      <Button variant="secondary" icon={Pencil} className="w-full mt-2" onClick={() => onEdit(vision)}>Edit</Button>
    </Modal>
  );
}

function Part({ label, color, children }) {
  return (
    <section className="mb-4 pl-3 border-l-2" style={{ borderLeftColor: color }}>
      <div className="text-label uppercase text-textMuted mb-1">{label}</div>
      {children}
    </section>
  );
}
