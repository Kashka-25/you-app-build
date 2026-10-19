// Your values in focus as a constellation (Cassidy, Oct 19: make Values a
// pleasure to look at). Each value is a star in its Element's colour, bigger
// and brighter as it ripens through its current cycle; a gold thread joins
// them; open places are faint dashed stars. Tap a star to open its card, or
// an open place to add a value. Still, like the night: nothing moves on its own.
const W = 320;
const H = 200;

// Fixed background stars, so the sky is the same every visit.
const DUST = [
  // (kept clear of the heading in the top-left corner)
  [52, 64, 0.6], [110, 44, 0.6], [178, 52, 0.5], [236, 22, 0.9],
  [246, 46, 0.6], [282, 16, 0.8], [304, 58, 0.6], [30, 120, 0.5], [92, 150, 0.7], [160, 160, 0.5],
  [232, 148, 0.7], [296, 132, 0.5], [128, 96, 0.4], [196, 104, 0.4]
];

export default function ValuesSky({ stars, open, onSelect, onAdd, total }) {
  // Places in a zigzag across a gentle arc, like a real constellation, so
  // neighbouring names never crowd each other.
  const slots = Math.max(total, stars.length, 1);
  const place = i => {
    const t = slots === 1 ? 0.5 : i / (slots - 1);
    return { x: 36 + t * (W - 72), y: 112 - Math.sin(Math.PI * t) * 26 + (i % 2 ? 26 : -18) };
  };
  const lit = stars.map((s, i) => ({ ...s, ...place(i) }));
  const empty = Array.from({ length: Math.max(0, total - stars.length) }, (_, j) => place(stars.length + j));

  return (
    <div
      className="relative rounded-card overflow-hidden shadow-cardDark mb-4"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, rgba(108,104,182,0.45) 0%, rgba(108,104,182,0) 60%), radial-gradient(80% 90% at 100% 110%, rgba(31,122,130,0.28) 0%, rgba(31,122,130,0) 60%), #0B0B1F" }}
    >
      <div className="absolute left-4 top-3 text-label uppercase tracking-[0.14em] text-[#C9A24D]">
        Your values sky · {stars.length} of {total}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="group" aria-label={`${stars.length} of ${total} values in focus`}>
        <defs>
          <radialGradient id="value-star-glow">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {DUST.map(([x, y, o], i) => <circle key={i} cx={x} cy={y} r={o > 0.7 ? 1.1 : 0.8} fill="#F2F1FA" fillOpacity={o} />)}

        {/* The thread through your values, in the order you hold them. */}
        {lit.length > 1 && (
          <polyline points={lit.map(s => `${s.x},${s.y}`).join(" ")} fill="none" stroke="#E0B865" strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="1 3.5" strokeLinecap="round" />
        )}

        {empty.map((p, j) => (
          <g key={`e${j}`} onClick={onAdd} className="cursor-pointer" role="button" aria-label="Add a value to this open place" tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAdd(); } }}>
            <circle cx={p.x} cy={p.y} r="11" fill="none" stroke="#B8B5D6" strokeOpacity="0.55" strokeDasharray="2 3" />
            <path d={`M${p.x - 4},${p.y} H${p.x + 4} M${p.x},${p.y - 4} V${p.y + 4}`} stroke="#B8B5D6" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
            <text x={p.x} y={p.y + 25} textAnchor="middle" fontSize="8.5" fill="#8A88AE">Open</text>
          </g>
        ))}

        {lit.map(s => {
          const size = 7 + (s.pct / 100) * 5;
          const on = open === s.name;
          return (
            <g key={s.name} onClick={() => onSelect(s.name)} className="cursor-pointer" role="button" tabIndex={0}
              aria-pressed={on} aria-label={`${s.name}, ${s.tier}`}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.name); } }}>
              <circle cx={s.x} cy={s.y} r={size * 3.4} fill={s.color} fillOpacity={0.28 + (s.pct / 100) * 0.2} />
              <circle cx={s.x} cy={s.y} r={size * 2.4} fill="url(#value-star-glow)" opacity={0.75} />
              <circle cx={s.x} cy={s.y} r={size} fill={`color-mix(in srgb, ${s.color} 62%, #FFF6DC)`} stroke="#FBF3DF" strokeWidth={on ? 1.8 : 1} strokeOpacity={on ? 1 : 0.8} />
              <circle cx={s.x - size * 0.28} cy={s.y - size * 0.3} r={size * 0.38} fill="#FFFFFF" fillOpacity="0.7" />
              {on && <circle cx={s.x} cy={s.y} r={size + 5} fill="none" stroke="#C9A24D" strokeWidth="1" />}
              <text x={s.x} y={s.y + size + 14} textAnchor="middle" fontSize="11" fill="#F2F1FA" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600">{s.name}</text>
              <text x={s.x} y={s.y + size + 25} textAnchor="middle" fontSize="7.5" fill={s.tierColor} letterSpacing="0.6">{s.tier.toUpperCase()}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
