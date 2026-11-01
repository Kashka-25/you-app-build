import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// A memory's photos, one at a time: swipe (or scroll) between them, or use
// the arrows. Never moves on its own. A single photo shows as a plain image.
// Tapping a photo opens it full screen, where it can be pinched to zoom
// (Cassidy, Oct 28).
export function PhotoCarousel({ urls = [], className = "h-36", rounded = "rounded-sm" }) {
  const track = useRef(null);
  const [rawIndex, setIndex] = useState(0);
  const [viewing, setViewing] = useState(null);
  // A photo removed while viewing the last one can't leave the count past the end.
  const index = Math.min(rawIndex, Math.max(0, urls.length - 1));
  if (!urls.length) return null;
  const viewer = viewing != null && <PhotoViewer urls={urls} start={viewing} onClose={() => setViewing(null)} />;
  if (urls.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setViewing(0); }}
          className={`block w-full overflow-hidden ${rounded}`}
          aria-label="Open the photo full screen"
        >
          <img src={urls[0]} alt="" loading="lazy" className={`w-full object-cover ${className}`} />
        </button>
        {viewer}
      </>
    );
  }

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
          <button
            key={u}
            type="button"
            onClick={() => setViewing(i)}
            aria-label={`Photo ${i + 1} of ${urls.length}, open full screen`}
            className="w-full h-full flex-none snap-center"
          >
            <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
          </button>
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
      {viewer}
    </div>
  );
}

// Full screen on black: the whole photo (not cropped), pinch to zoom, swipe
// or arrow between photos, the cross or Escape to close.
function PhotoViewer({ urls, start, onClose }) {
  const track = useRef(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    track.current?.scrollTo({ left: start * track.current.clientWidth });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, []);

  const go = i => {
    const el = track.current;
    const next = Math.max(0, Math.min(urls.length - 1, i));
    setIndex(next);
    el?.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  const arrow = "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-cream flex items-center justify-center";

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/95" role="dialog" aria-modal="true" aria-label="Photo" onClick={e => e.stopPropagation()}>
      <div
        ref={track}
        onScroll={() => track.current && setIndex(Math.round(track.current.scrollLeft / track.current.clientWidth))}
        className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {urls.map(u => (
          <div key={u} className="w-full h-full flex-none snap-center flex items-center justify-center overflow-auto [touch-action:pan-x_pan-y_pinch-zoom]">
            <img src={u} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-10 h-10 rounded-full bg-white/15 text-cream flex items-center justify-center"
        aria-label="Close"
      >
        <X size={20} strokeWidth={2} />
      </button>
      {index > 0 && (
        <button type="button" onClick={() => go(index - 1)} className={`${arrow} left-3`} aria-label="Previous photo">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}
      {index < urls.length - 1 && (
        <button type="button" onClick={() => go(index + 1)} className={`${arrow} right-3`} aria-label="Next photo">
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      )}
      {urls.length > 1 && (
        <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] inset-x-0 text-center text-cream text-label" aria-live="polite">
          {index + 1} / {urls.length}
        </div>
      )}
    </div>,
    document.body
  );
}
