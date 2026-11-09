import { useState } from "react";
import { FlaskConical, RotateCcw, LogOut, ArrowLeft, X } from "lucide-react";
import { isDemo, resetDemo, leaveDemo, demoBackUrl } from "../../lib/demo/mode";

// "Demo · example data" on every screen while in the demo, with Reset and
// the way back (Cassidy, Nov 9). It sits top centre on the top bar's lower
// edge, clear of the buttons; a tap opens its choices underneath.
export default function DemoBadge() {
  const [open, setOpen] = useState(false);
  // The /demo page says all this itself.
  if (!isDemo() || window.location.pathname === "/demo") return null;
  const back = demoBackUrl();

  return (
    <div
      // Phones: on the top bar's lower edge. Laptops have no top bar, so it
      // sits at the very top instead of over the page's art.
      className="fixed left-1/2 -translate-x-1/2 z-[70] font-sans flex flex-col items-center top-[calc(env(safe-area-inset-top)+53px)] lg:top-2"
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 min-h-[24px] px-3 rounded-full bg-[#19193D]/85 text-[#F4E6C8] text-[11px] font-semibold tracking-wide shadow-card backdrop-blur-sm"
      >
        <FlaskConical size={12} strokeWidth={1.75} aria-hidden="true" />
        Demo · example data
      </button>
      {open && (
        <div role="dialog" aria-label="Demo" className="mt-2 w-[260px] rounded-card bg-surface2 border border-borderC shadow-card p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-bodySm text-textPrimary m-0">
              You're trying YOU with example data. It stays in this browser and nothing is sent anywhere.
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex-none -mr-1 -mt-1 p-1 text-textMuted">
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            <button type="button" onClick={() => resetDemo()} className="w-full inline-flex items-center gap-2 min-h-[40px] px-3 rounded-full border border-borderC text-bodySm text-textPrimary">
              <RotateCcw size={15} strokeWidth={1.75} /> Reset demo
            </button>
            <button type="button" onClick={() => leaveDemo()} className="w-full inline-flex items-center gap-2 min-h-[40px] px-3 rounded-full border border-borderC text-bodySm text-textPrimary">
              {back ? <ArrowLeft size={15} strokeWidth={1.75} /> : <LogOut size={15} strokeWidth={1.75} />}
              {back ? "Back to Creative Universe" : "Leave demo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
