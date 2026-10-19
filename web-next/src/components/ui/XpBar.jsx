// The segmented XP bar, Fallout-style (Cassidy, Oct 19: "I find this
// engaging"): ten blocks that light up in the Pillar's or value's colour as
// XP gathers toward the next level, with the count beside it.
const SEGMENTS = 10;

export function XpBar({ pct, color, xp, of, className = "" }) {
  const clamped = Math.min(100, Math.max(0, pct));
  // Any XP at all lights the first block, so a first step always shows.
  const filled = clamped > 0 ? Math.max(1, Math.floor((clamped / 100) * SEGMENTS)) : 0;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 flex gap-[3px]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="XP toward the next level">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className="flex-1 h-2 rounded-[2px]"
              style={on
                ? { background: color, boxShadow: `0 0 5px color-mix(in srgb, ${color} 55%, transparent)` }
                : { background: "var(--surface-3)" }}
            />
          );
        })}
      </div>
      {xp !== undefined && (
        <span className="text-[10.5px] tabular-nums text-textMuted flex-none">{xp}/{of} XP</span>
      )}
    </div>
  );
}
