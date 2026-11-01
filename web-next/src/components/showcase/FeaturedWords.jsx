/** The small chip in the corner of the home art. */
export function CreditChip({ work, onOpen }) {
  const name = work.artist?.display_name || "an artist";
  return (
    <button
      type="button"
      onClick={() => onOpen(work)}
      className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 max-w-[60%] min-h-[32px] px-3 rounded-full bg-black/45 text-white text-caption backdrop-blur-sm border border-white/15`}
    >
      <span className="truncate">Art by {name}</span>
    </button>
  );
}
