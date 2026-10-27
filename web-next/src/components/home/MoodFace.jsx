import { moodColour } from "../../lib/mood";

// A sweet little face whose feeling follows the score (0–100): heavy eyes
// and a small tear at the bottom, round eyes in the middle, happy arcs,
// rosy cheeks and a sparkle at the top. Everything moves smoothly between.
export default function MoodFace({ score = 50, size = 96, className = "" }) {
  const s = Math.max(0, Math.min(100, score)) / 100;
  const tint = moodColour(score);
  // Mouth: a curve from a soft frown to a wide smile.
  const curve = -14 + 30 * s;               // control point offset
  const width = 16 + 8 * s;
  const mouth = `M ${50 - width} 66 Q 50 ${66 + curve} ${50 + width} 66`;
  // Eyes: droopy lids low down, open dots in the middle, smiling arcs high.
  const lidDrop = Math.max(0, 0.35 - s) * 16;     // how far the lids droop
  const happy = Math.max(0, s - 0.62) / 0.38;     // 0..1 as it turns to arcs
  const blush = Math.max(0, s - 0.45) * 1.4;
  const tear = s < 0.18 ? (0.18 - s) / 0.18 : 0;
  const sparkle = s > 0.86 ? (s - 0.86) / 0.14 : 0;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={`Mood ${Math.round(score)} out of 100`}>
      <defs>
        <radialGradient id={`moodglow-${size}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF8EC" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#moodglow-${size})`} stroke={tint} strokeWidth="2.5" />
      {/* cheeks */}
      <ellipse cx="27" cy="60" rx="8" ry="5" fill="#E8938A" opacity={Math.min(0.55, blush)} />
      <ellipse cx="73" cy="60" rx="8" ry="5" fill="#E8938A" opacity={Math.min(0.55, blush)} />
      {/* eyes */}
      {[36, 64].map(x => (
        <g key={x}>
          {happy < 0.5 ? (
            <>
              <ellipse cx={x} cy="44" rx="4.2" ry={4.6 - lidDrop * 0.18} fill="#3A2618" />
              <circle cx={x + 1.4} cy="42.4" r="1.3" fill="#FFF8EC" />
              {lidDrop > 0 && <path d={`M ${x - 6} ${40 + lidDrop * 0.2} Q ${x} ${38 + lidDrop} ${x + 6} ${40 + lidDrop * 0.2}`} stroke="#3A2618" strokeWidth="2" fill="none" strokeLinecap="round" />}
            </>
          ) : (
            <path d={`M ${x - 5.5} 46 Q ${x} ${46 - 7 * happy} ${x + 5.5} 46`} stroke="#3A2618" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          )}
        </g>
      ))}
      {/* mouth */}
      <path d={mouth} stroke="#3A2618" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* a small tear, very low down */}
      {tear > 0 && <path d="M 66 52 q 3 6 0 9 q -3 -3 0 -9 z" fill="#8FB8C9" opacity={tear} />}
      {/* a sparkle, right at the top */}
      {sparkle > 0 && (
        <path d="M 82 16 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 l 6 -2 z" fill="#E2BA70" opacity={sparkle} />
      )}
    </svg>
  );
}
