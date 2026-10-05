import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// A memory's photos, one at a time: swipe (or scroll) between them, or use
// the arrows. Never moves on its own. A single photo shows as a plain image.
export function PhotoCarousel({ urls = [], className = "h-36", rounded = "rounded-sm" }) {
  const track = useRef(null);
  const [rawIndex, setIndex] = useState(0);
  // A photo removed while viewing the last one can't leave the count past the end.
  const index = Math.min(rawIndex, Math.max(0, urls.length - 1));
  if (!urls.length) return null;
  if (urls.length === 1) return <img src={urls[0]} alt="" loading="lazy" className={`w-full object-cover ${rounded} ${className}`} />;

  const go = i => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(urls.length - 1, i));
    // Set now rather than waiting for the scroll to report back.
    setIndex(next);
    el.scrollTo({ left: next * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  const arrow = "absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 text-cream flex items-center justify-center";

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${urls.length} photos`}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      }}
    >
      <div
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none"
      >
        {urls.map((u, i) => (
          <img
            key={u}
            src={u}
            alt=""
            loading="lazy"
            aria-label={`Photo ${i + 1} of ${urls.length}`}
            className="w-full h-full flex-none object-cover snap-center"
          />
        ))}
      </div>
      {index > 0 && (
        <button type="button" onClick={() => go(index - 1)} className={`${arrow} left-2`} aria-label="Previous photo">
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
      )}
      {index < urls.length - 1 && (
        <button type="button" onClick={() => go(index + 1)} className={`${arrow} right-2`} aria-label="Next photo">
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}
      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
        {urls.map((u, i) => (
          <span key={u} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-cream" : "bg-cream opacity-50"}`} />
        ))}
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/45 text-cream text-label" aria-live="polite">
        {index + 1}/{urls.length}
      </div>
    </div>
  );
}
