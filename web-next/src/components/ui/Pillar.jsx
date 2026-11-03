import { Sparkles } from "lucide-react";
import { PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { PILLAR_ICONS } from "../../constants/pillarIcons";

// The Pillars wear the same symbol and colour everywhere they appear
// (Cassidy, Nov 2): YOUrney's Identity, PursYOUts, the add forms, the tree.
// One place to draw them, so they can't drift apart.

export const pillarColor = p => PILLAR_COLORS[p] || "var(--gold)";

/** The Pillar's symbol in a soft round of its colour. */
export function PillarSymbol({ pillar, size = 24, className = "" }) {
  const Icon = PILLAR_ICONS[pillar] || Sparkles;
  const color = pillarColor(pillar);
  return (
    <span
      aria-hidden="true"
      className={`rounded-full flex items-center justify-center flex-none ${className}`}
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
    >
      <Icon size={Math.round(size * 0.54)} strokeWidth={1.9} />
    </span>
  );
}

/**
 * A Pillar heading: its colour stripe, symbol and name in bold, with an
 * optional count ("3 resting", "2").
 */
export function PillarTitle({ pillar, count, countLabel = "" }) {
  const color = pillarColor(pillar);
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-1.5 h-7 rounded-full flex-none" style={{ background: color }} aria-hidden="true" />
      <PillarSymbol pillar={pillar} size={26} />
      <span className="font-bold">{pillar}</span>
      {count > 0 && (
        <span
          className="font-sans text-caption font-medium px-2 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          {countLabel ? `${count} ${countLabel}` : count}
        </span>
      )}
    </span>
  );
}

/** A small tag naming a Pillar, with its symbol, in its colour. */
export function PillarChip({ pillar, className = "" }) {
  const Icon = PILLAR_ICONS[pillar] || Sparkles;
  const color = pillarColor(pillar);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${className}`}
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {pillar}
    </span>
  );
}

/** Choosing a Pillar: all eight at once, each with its symbol and colour. */
export function PillarPicker({ value, onChange, className = "", label = "Life area" }) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid grid-cols-2 gap-1.5 ${className}`}>
      {PILLARS.map(p => {
        const on = value === p;
        const color = pillarColor(p);
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p)}
            className={`flex items-center gap-2 min-h-[44px] px-2.5 rounded-sm border text-bodySm text-left transition ${
              on ? "font-semibold text-textPrimary" : "border-borderC bg-surface1 text-textSecondary hover:text-textPrimary"
            }`}
            style={on ? { borderColor: color, background: `color-mix(in srgb, ${color} 12%, var(--surface-1))` } : undefined}
          >
            <PillarSymbol pillar={p} size={26} />
            <span className="min-w-0 truncate">{p}</span>
          </button>
        );
      })}
    </div>
  );
}
