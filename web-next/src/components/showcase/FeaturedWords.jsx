import { Feather } from "lucide-react";
import { creditLine } from "../../lib/showcase";

// The written piece featured now: a few lines, credited, opening in full.
export default function FeaturedWords({ work, onOpen }) {
  if (!work) return null;
  const name = work.artist?.display_name || "An artist";
  return (
    <section aria-labelledby="home-featured-words" className="rounded-card bg-surface1 shadow-card p-4 border-l-2 border-gold">
      <h2 id="home-featured-words" className="flex items-center gap-2 text-label uppercase text-gold m-0 mb-2">
        <Feather size={13} strokeWidth={1.75} aria-hidden="true" /> Featured words
      </h2>
      <button type="button" onClick={() => onOpen(work)} className="block w-full text-left">
        {work.title && <div className="font-serif text-h3 text-textPrimary mb-1">{work.title}</div>}
        <p className="font-serif italic text-body text-textPrimary m-0 whitespace-pre-line line-clamp-5">{work.body}</p>
        <span className="block text-caption text-textSecondary mt-2">{creditLine(name, work.credits)} · read and support</span>
      </button>
    </section>
  );
}

/** The small chip in the corner of the home art. */
export function CreditChip({ work, onOpen }) {
  const name = work.artist?.display_name || "an artist";
  return (
    <button
      type="button"
      onClick={() => onOpen(work)}
      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 max-w-[60%] min-h-[32px] px-3 rounded-full bg-black/45 text-white text-caption backdrop-blur-sm border border-white/15"
    >
      <span className="truncate">Art by {name}</span>
    </button>
  );
}
