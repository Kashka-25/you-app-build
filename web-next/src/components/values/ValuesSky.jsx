import { TIERS } from "../../constants/app.const";

// Your values in focus as a quiet constellation (Cassidy, Oct 19: make Values
// a pleasure to look at; Nov 3, a beta tester: "looks too busy", and Cassidy
// chose the Quiet direction). One gentle arc, a name under or over each star
// and nothing else: a star's size is its tier (Awakening small, Mastering
// full) and its colour its Element. Tap a star and one line below says its
// tier. By day it's a star chart inked on parchment (Nature, no blues); by
// night, the Cosmos. Still, like the night: nothing moves on its own.
const W = 320;
const H = 130;

// A few fixed background stars, so the sky is the same every visit.
const DUST = [[60, 24], [250, 18], [140, 110], [300, 96]];

const SKY_CSS = `
.values-sky{--vs-bg:radial-gradient(90% 80% at 50% 0%,rgba(255,250,240,.9),rgba(255,250,240,0) 70%),linear-gradient(180deg,#F6EEE1,#EADBC5);--vs-ink:#3A2618;--vs-soft:#94806D;--vs-line:#A07A2C;--vs-dust:#A07A2C;--vs-core:#FFF8EA}
[data-mode=dark] .values-sky{--vs-bg:radial-gradient(110% 90% at 50% -10%,rgba(108,104,182,.32),rgba(108,104,182,0) 60%),#0D0D25;--vs-ink:#F2F1FA;--vs-soft:#8A88AE;--vs-line:#E0B865;--vs-dust:#F2F1FA;--vs-core:#FFF6DC}
`;

const tierIndex = name => Math.max(0, TIERS.findIndex(t => t.name === name));

function onKey(run) {
  return e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } };
}

export default function ValuesSky({ stars, open, onSelect, onAdd, total }) {
  const slots = Math.max(total, stars.length, 1);
  const place = i => {
    const t = slots === 1 ? 0.5 : i / (slots - 1);
    return { x: 28 + t * (W - 56), y: 78 - Math.sin(Math.PI * t) * 34 };
  };
  const lit = stars.map((s, i) => ({ ...s, ...place(i) }));
  const empty = Array.from({ length: Math.max(0, total - stars.length) }, (_, j) => place(stars.length + j));
  const chosen = stars.find(s => s.name === open);

  return (
    <div className="values-sky relative rounded-card overflow-hidden mb-4 border border-borderC">
      <style>{SKY_CSS}</style>
      <div className="absolute inset-0" style={{ background: "var(--vs-bg)" }} />
      <div className="relative">
        <div className="px-4 pt-3 text-label uppercase tracking-[0.14em] text-gold">Your values sky</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="group" aria-label={`${stars.length} of ${total} values in focus`}>
          {DUST.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.8" fill="var(--vs-dust)" fillOpacity="0.45" />)}

          {/* The thread through your values, in the order you hold them. */}
          {lit.length > 1 && (
            <polyline points={lit.map(s => `${s.x},${s.y}`).join(" ")} fill="none" stroke="var(--vs-line)" strokeOpacity="0.35" strokeWidth="0.8" />
          )}

          {empty.map((p, j) => (
            <g key={`e${j}`} onClick={onAdd} onKeyDown={onKey(onAdd)} className="cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-1" role="button" tabIndex={0} aria-label="Add a value to this open place">
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              <circle cx={p.x} cy={p.y} r="4" fill="none" stroke="var(--vs-soft)" strokeOpacity="0.7" strokeDasharray="1.5 2" />
            </g>
          ))}

          {lit.map((s, i) => {
            const r = 3.2 + tierIndex(s.tier) * 1.3;
            const on = open === s.name;
            return (
              <g key={s.name} onClick={() => onSelect(s.name)} onKeyDown={onKey(() => onSelect(s.name))} className="cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-1"
                role="button" tabIndex={0} aria-pressed={on} aria-label={`${s.name}, ${s.tier}`}>
                <circle cx={s.x} cy={s.y} r="18" fill="transparent" />
                <circle cx={s.x} cy={s.y} r={r * 2.2} fill={s.color} fillOpacity={0.12 + tierIndex(s.tier) * 0.05} />
                <circle cx={s.x} cy={s.y} r={r} fill={`color-mix(in srgb, ${s.color} 70%, var(--vs-core))`} />
                {on && <circle cx={s.x} cy={s.y} r={r + 5} fill="none" stroke="var(--vs-line)" strokeWidth="1" />}
                {/* Names alternate over and under the arc so neighbours never touch. */}
                <text x={s.x} y={i % 2 ? s.y - 13 : s.y + 22} textAnchor="middle" fontSize="11" fill="var(--vs-ink)" fillOpacity={on ? 1 : 0.8}
                  fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600">{s.name}</text>
              </g>
            );
          })}
        </svg>
        <div className="px-4 pb-3 -mt-1 text-caption min-h-[1.25rem]" style={{ color: "var(--vs-soft)" }} aria-live="polite">
          {chosen
            ? <><span style={{ color: "var(--vs-ink)" }}>{chosen.name}</span> · <span style={{ color: chosen.tierColor }}>{chosen.tier}</span></>
            : `${stars.length} of ${total} in focus · tap a star`}
        </div>
      </div>
    </div>
  );
}
