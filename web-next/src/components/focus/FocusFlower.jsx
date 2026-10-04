// The flower that grows during a focus session, and the small blooms and
// resting seeds of the garden. Drawn from growth (0..1) alone, so the same
// shape can be shown mid-session, as a finished bloom, or tiny in the
// garden. Motion is allowed here on purpose: watching it grow is the point.

const SWAY_CSS = `
@keyframes you-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
.you-sway { transform-origin: 100px 168px; animation: you-sway 6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .you-sway { animation: none; } }
`;

const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const phase = (g, from, to) => Math.max(0, Math.min(1, (g - from) / (to - from)));

export function FocusFlower({ growth = 0, color = "#C9A24D", sway = false, size = 200, glow = true }) {
  const g = growth;
  const stemTop = lerp(160, 70, phase(g, 0.08, 0.8));
  const leafA = phase(g, 0.15, 0.4);
  const leafB = phase(g, 0.3, 0.55);
  const bud = phase(g, 0.45, 0.8);
  const open = phase(g, 0.8, 1);
  const seedVisible = g < 0.12;
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 200 190" aria-hidden="true">
      <style>{SWAY_CSS}</style>
      <ellipse cx="100" cy="168" rx="70" ry="8" fill="#2A3B2F" />
      {seedVisible && <ellipse cx="100" cy="160" rx="12" ry="8" fill="#8A6A3A" stroke="#C9A24D" strokeWidth="1.2" opacity={1 - phase(g, 0.06, 0.12)} />}
      <g className={sway ? "you-sway" : undefined}>
        {g > 0.04 && (
          <path d={`M100 166 C100 ${lerp(166, 130, g)} 100 ${stemTop + 30} 100 ${stemTop}`} stroke="#7A9B76" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {leafA > 0 && (
          <path transform={`translate(100 ${lerp(150, 132, g)}) scale(${leafA}) translate(-100 -132)`}
            d="M100 132 C84 128 74 116 72 102 C88 104 98 114 100 132 Z" fill="#7A9B76" />
        )}
        {leafB > 0 && (
          <path transform={`translate(100 ${lerp(140, 118, g)}) scale(${leafB}) translate(-100 -118)`}
            d="M100 118 C116 112 126 100 128 86 C112 90 101 102 100 118 Z" fill="#8FB08A" />
        )}
        {bud > 0 && (
          <g transform={`translate(100 ${stemTop - 6})`}>
            {glow && open > 0 && <circle r={34 * open} fill={color} opacity={0.14} />}
            {petals.map(a => (
              <ellipse key={a} cx="0" cy={-lerp(4, 15, open)} rx={lerp(4, 9, open) * bud} ry={lerp(7, 15, open) * bud}
                transform={`rotate(${open > 0 ? a : (a % 90 === 0 ? a / 6 : -a / 6)})`}
                fill={a % 90 === 0 ? "#EDE6D6" : "#F7F1E1"} opacity={open > 0 || a % 90 === 0 ? 1 : 0.85} />
            ))}
            {open > 0 && <circle r={lerp(2, 7, open)} fill={color} />}
            {open === 0 && <ellipse cx="0" cy="2" rx={6 * bud} ry={4 * bud} fill="#7A9B76" />}
          </g>
        )}
      </g>
    </svg>
  );
}

export function RestingSeed({ size = 200 }) {
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 200 190" aria-hidden="true">
      <ellipse cx="100" cy="168" rx="70" ry="8" fill="#2A3B2F" />
      <ellipse cx="100" cy="158" rx="13" ry="9" fill="#8A6A3A" stroke="#C9A24D" strokeWidth="1.2" />
      <path d="M96 154 q4 -4 8 0" stroke="#EDE6D6" strokeOpacity="0.5" fill="none" strokeWidth="1" />
    </svg>
  );
}

// Garden-sized marks, drawn inside a parent <svg> at (x, y) = ground point.
export function GardenBloom({ x, y, color, scale = 1 }) {
  const h = 22 * scale;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 0 C0 ${-h * 0.4} 0 ${-h * 0.7} 0 ${-h}`} stroke="#7A9B76" strokeWidth={1.2 * scale} fill="none" />
      <path d={`M0 ${-h * 0.35} C${-5 * scale} ${-h * 0.4} ${-7 * scale} ${-h * 0.55} ${-7 * scale} ${-h * 0.65} C${-3 * scale} ${-h * 0.6} 0 ${-h * 0.5} 0 ${-h * 0.35} Z`} fill="#7A9B76" />
      <g transform={`translate(0 ${-h})`}>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <ellipse key={a} cx="0" cy={-3.4 * scale} rx={2.2 * scale} ry={3.6 * scale} transform={`rotate(${a})`} fill="#F2EBDA" />
        ))}
        <circle r={2 * scale} fill={color} />
      </g>
    </g>
  );
}

export function GardenSeed({ x, y, scale = 1 }) {
  return <ellipse cx={x} cy={y - 2 * scale} rx={3.4 * scale} ry={2.4 * scale} fill="#8A6A3A" stroke="#C9A24D" strokeWidth={0.6 * scale} />;
}
