import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Pill tabs. Labels never wrap: segments share the width when everything
// fits, and the row scrolls sideways when it doesn't (e.g. YOUrney's four
// tabs on a phone), with a soft fade on whichever edge has more to see.
// The selected tab is always brought into view.
export function SegmentedControl({ options, value, onChange }) {
  const rowRef = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });

  function measure() {
    const el = rowRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    });
  }

  useLayoutEffect(() => {
    measure();
    const el = rowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [options.length]);

  // Scroll only the row (never the page) to keep the active tab visible.
  useEffect(() => {
    const el = rowRef.current;
    const active = el?.querySelector('[aria-selected="true"]');
    if (!el || !active) return;
    const left = active.offsetLeft - 8;
    const right = active.offsetLeft + active.offsetWidth + 8;
    if (left < el.scrollLeft) el.scrollTo({ left, behavior: "smooth" });
    else if (right > el.scrollLeft + el.clientWidth) el.scrollTo({ left: right - el.clientWidth, behavior: "smooth" });
  }, [value]);

  return (
    <div className="relative bg-surface3 rounded-full p-1">
      <div
        ref={rowRef}
        onScroll={measure}
        role="tablist"
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map(opt => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={`flex-1 shrink-0 whitespace-nowrap text-bodySm px-3.5 py-1.5 rounded-full transition-colors duration-200 ${
                active ? "bg-forestAccent text-surface2 font-medium" : "text-textSecondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {fade.left && (
        <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1 bottom-1 w-6 rounded-l-full bg-gradient-to-r from-surface3 to-transparent" />
      )}
      {fade.right && (
        <span aria-hidden="true" className="pointer-events-none absolute right-1 top-1 bottom-1 w-6 rounded-r-full bg-gradient-to-l from-surface3 to-transparent" />
      )}
    </div>
  );
}
