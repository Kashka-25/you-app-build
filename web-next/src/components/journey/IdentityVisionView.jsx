import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, ArrowRight, Sprout } from "lucide-react";
import { DropdownSection } from "../Primitives";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { PillarSymbol, PillarTitle, pillarColor } from "../ui/Pillar";
import { Button } from "../ui/Button";
import IdentityVisionModal from "./IdentityVisionModal";
import VisionSheet from "./VisionSheet";
import { visionItems, votesThisWeek } from "../../lib/visions";

// A keepsake card (Nov 4): the life area's colour as a soft glow, the
// name and its line, and the pursuits that grow it as small seeds along
// the foot, with this week's votes. Tap to open everything it holds.
function VisionCard({ vision, onOpen }) {
  const { items, memory, habitLogs } = useAppData();
  const color = pillarColor(vision.category);
  const seeds = visionItems(vision, items);
  const votes = votesThisWeek(vision, items, memory, habitLogs);
  return (
    <button
      type="button"
      onClick={() => onOpen(vision)}
      className="relative w-full text-left rounded-card bg-surface1 shadow-card p-4 mb-3 overflow-hidden border"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
    >
      <span
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${color} 30%, transparent) 0%, transparent 70%)` }}
        aria-hidden="true"
      />
      <div className="relative flex gap-3">
        <PillarSymbol pillar={vision.category} size={40} className="flex-none mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-h2 leading-tight text-textPrimary">{vision.title}</div>
          {vision.statement && <p className="font-serif italic text-body text-textSecondary leading-snug m-0 mt-1">{vision.statement}</p>}
        </div>
      </div>
      {(seeds.length > 0 || votes > 0) && (
        <div className="relative mt-3 pt-3 border-t border-borderC">
          {votes > 0 && (
            <div className="text-caption font-medium mb-1.5" style={{ color }}>
              {votes} {votes === 1 ? "vote" : "votes"} for {vision.title} this week
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {seeds.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 text-caption text-textSecondary bg-surface3 rounded-full pl-2 pr-2.5 py-0.5 max-w-full">
                <Sprout size={12} strokeWidth={1.75} style={{ color: pillarColor(s.cat) }} aria-hidden="true" />
                <span className="truncate">{s.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

// Not a goal list: nothing here has a done flag or earns XP. It's who
// you're orienting toward, grouped by life area in PILLARS' fixed order,
// each in its colour (Cassidy liked the colours, Nov 4). The way in is
// Meet your future self; Add a vision stays for writing one directly.
export default function IdentityVisionView() {
  const { identityVisions } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const open = identityVisions.find(v => v.id === openId) || null;

  const groups = PILLARS
    .map(cat => ({ category: cat, visions: identityVisions.filter(v => v.category === cat) }))
    .filter(g => g.visions.length > 0);
  const other = identityVisions.filter(v => !PILLARS.includes(v.category));

  return (
    <>
      <Link
        to="/future-self"
        className="relative block rounded-card overflow-hidden p-5 mb-5 shadow-card text-white"
        style={{ background: "linear-gradient(160deg, #E9C99A -10%, #B78DA8 30%, #5E4A86 70%, #1B1638 120%)" }}
      >
        <Sparkles size={22} strokeWidth={1.5} className="mb-2 opacity-90" aria-hidden="true" />
        <div className="font-serif text-[26px] leading-tight">Meet your future self</div>
        <p className="text-bodySm text-white/85 m-0 mt-1 max-w-[34ch]">
          A quiet walk to who you're becoming: a day in their life, the people who love you, a letter back, and your first steps.
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 min-h-[40px] px-4 rounded-full bg-white text-[#24183A] text-bodySm font-medium">
          Begin <ArrowRight size={16} strokeWidth={1.75} />
        </span>
        <span className="block text-caption text-white/70 mt-2">About 10 minutes · no AI · you can skip any step</span>
      </Link>

      <div className="flex justify-between items-center mb-1">
        <span className="font-serif text-h2 font-medium">Who you're becoming</span>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAddOpen(true)}>Write one</Button>
      </div>

      {identityVisions.length === 0 ? (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 mt-3 text-bodySm text-textMuted">
          Not goals, not something to finish: versions of yourself you're growing toward. A Poet, a Healer, a steady, present parent. Begin with Meet your future self above, or write one straight away.
        </div>
      ) : (
        <>
          {groups.map(({ category, visions }) => (
            <DropdownSection key={category} title={<PillarTitle pillar={category} count={visions.length} />} defaultOpen>
              {visions.map(v => <VisionCard key={v.id} vision={v} onOpen={x => setOpenId(x.id)} />)}
            </DropdownSection>
          ))}
          {other.length > 0 && (
            <DropdownSection title={<PillarTitle pillar="Other" count={other.length} />} defaultOpen={groups.length === 0}>
              {other.map(v => <VisionCard key={v.id} vision={v} onOpen={x => setOpenId(x.id)} />)}
            </DropdownSection>
          )}
        </>
      )}

      <VisionSheet vision={open} onClose={() => setOpenId(null)} onEdit={v => { setOpenId(null); setEditing(v); }} />
      <IdentityVisionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <IdentityVisionModal open={Boolean(editing)} vision={editing} onClose={() => setEditing(null)} />
    </>
  );
}
