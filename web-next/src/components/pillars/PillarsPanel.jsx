import { useAppData } from "../../lib/AppDataContext";

// Attribute-bar style, inspired by NBA 2K / Fallout stat screens —
// segmented blocks rather than a smooth gradient slider.
const SEGMENTS = 10;

export default function PillarsPanel() {
  const { pillars } = useAppData();

  return (
    <div className="space-y-3">
      {pillars.map(p => {
        const filled = Math.round((p.pct / 100) * SEGMENTS);
        return (
          <div key={p.name}>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="font-medium">{p.name}</span>
              <span className="text-textMuted">{p.xp} XP</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2.5 rounded-sm"
                  style={{ background: i < filled ? p.color : "var(--surface-3)" }}
                />
              ))}
            </div>
            <div className="flex gap-3 text-[10px] text-textMuted mt-1">
              <span>Active: {p.active}</span>
              <span>Best streak: {p.bestStreak}d</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
