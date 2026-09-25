import { useState } from "react";
import { Plus, Compass, Dumbbell, Brain, Sparkles, HeartHandshake, Briefcase, Palette } from "lucide-react";
import { DropdownSection } from "../Primitives";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import IdentityVisionModal from "./IdentityVisionModal";

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Same icon-per-Pillar mapping as PillarsPanel — one taxonomy (Pillars)
// used consistently across Pursue, Values and here, rather than Identity
// inventing its own categories.
const PILLAR_ICONS = {
  Body: Dumbbell,
  Mind: Brain,
  Spirit: Sparkles,
  Relationships: HeartHandshake,
  Work: Briefcase,
  Adventure: Compass,
  Creative: Palette
};

function CategoryHeading({ category, count }) {
  const Icon = PILLAR_ICONS[category] || Sparkles;
  const color = PILLAR_COLORS[category] || "var(--gold)";
  return (
    <span className="flex items-center gap-2">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center flex-none"
        style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
      >
        <Icon size={13} strokeWidth={1.75} />
      </span>
      {category} <span className="text-textMuted font-sans text-bodySm font-normal">({count})</span>
    </span>
  );
}

function VisionCard({ vision, onEdit }) {
  const color = PILLAR_COLORS[vision.category] || "var(--gold)";
  const Icon = PILLAR_ICONS[vision.category] || Sparkles;
  return (
    <button
      onClick={() => onEdit(vision)}
      className="w-full text-left rounded-card bg-surface1 shadow-card p-4 mb-3 border-l-2 flex gap-3.5"
      style={{ borderLeftColor: color }}
    >
      <GlowBubble icon={Icon} size={44} color={color} className="mt-0.5" animate={false} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <span className="font-serif text-h3 text-textPrimary">{vision.title}</span>
          <span className="text-caption text-textMuted flex-none mt-1">{niceDate(vision.vision_date)}</span>
        </div>
        <div className="relative pl-3">
          <span className="absolute left-0 top-0 font-serif text-h2 leading-none" style={{ color }}>"</span>
          <p className="font-serif text-body text-textSecondary italic leading-snug">{vision.statement}</p>
        </div>
        {vision.reflection && (
          <div className="text-bodySm text-textSecondary mt-2.5 pt-2.5 border-t border-borderC">{vision.reflection}</div>
        )}
      </div>
    </button>
  );
}

// Not a goal list — nothing here has a done flag or earns XP. It's a place
// to declare a version of yourself you're orienting toward (an identity,
// an ideal relationship, a life/work vision) whether or not it's practical
// or achievable on any timeline. Grouped by Pillar, in PILLARS' fixed
// order, matching Pursue's grouping exactly.
export default function IdentityVisionView() {
  const { identityVisions } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const groups = PILLARS
    .map(cat => ({ category: cat, visions: identityVisions.filter(v => v.category === cat) }))
    .filter(g => g.visions.length > 0);
  const other = identityVisions.filter(v => !PILLARS.includes(v.category));

  return (
    <>
      <div
        className="rounded-card bg-gradient-to-br from-forest to-forestAccent p-4 mb-5 shadow-card flex items-center gap-3.5"
        style={{ boxShadow: "0 0 40px -12px color-mix(in srgb, var(--gold) 35%, transparent)" }}
      >
        <GlowBubble icon={Compass} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-h3 text-cream">Who you're becoming</div>
          <div className="text-bodySm text-[color-mix(in_srgb,var(--cream)_85%,transparent)] mt-0.5">
            Not a goal, not something to complete — a version of yourself you're orienting toward.
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-1">
        <span className="font-serif text-h2 font-medium">Your visions</span>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAddOpen(true)}>Add a vision</Button>
      </div>

      {identityVisions.length === 0 ? (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 mt-4 text-bodySm text-textMuted">
          Nothing here yet — who are you trying to become? A title (Philosopher, Poet, Musician), the shape of
          the relationship you want, or the long-term direction of your life and work all belong here.
        </div>
      ) : (
        <>
          {groups.map(({ category, visions }) => (
            <DropdownSection key={category} title={<CategoryHeading category={category} count={visions.length} />} defaultOpen>
              {visions.map(v => <VisionCard key={v.id} vision={v} onEdit={setEditing} />)}
            </DropdownSection>
          ))}
          {other.length > 0 && (
            <DropdownSection title={<CategoryHeading category="Other" count={other.length} />} defaultOpen={groups.length === 0}>
              {other.map(v => <VisionCard key={v.id} vision={v} onEdit={setEditing} />)}
            </DropdownSection>
          )}
        </>
      )}

      <IdentityVisionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <IdentityVisionModal open={Boolean(editing)} vision={editing} onClose={() => setEditing(null)} />
    </>
  );
}
