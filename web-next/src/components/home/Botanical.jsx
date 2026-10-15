// A fine-line leaf sprig, drawn in currentColor, for quiet botanical
// detail at the edges of Home's cards. Purely decorative.
export function LeafSprig({ className = "", flip = false }) {
  return (
    <svg
      viewBox="0 0 64 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M10 94 C 18 70, 26 46, 46 6" />
      <path d="M16 78 C 6 72, 2 62, 4 52 C 14 56, 18 66, 16 78 Z" />
      <path d="M20 66 C 30 64, 38 56, 40 46 C 30 46, 22 54, 20 66 Z" />
      <path d="M26 52 C 16 46, 14 36, 18 28 C 26 34, 28 44, 26 52 Z" />
      <path d="M32 40 C 42 38, 50 30, 52 20 C 42 20, 34 28, 32 40 Z" />
      <path d="M40 22 C 34 16, 34 8, 38 2 C 44 8, 44 16, 40 22 Z" />
    </svg>
  );
}
