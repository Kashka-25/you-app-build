import { useState } from "react";
import { ArrowLeft, Sprout, UserRound, RotateCcw, LogOut } from "lucide-react";
import { isDemo, demoKind, enterDemo, resetDemo, leaveDemo, rememberBack, demoBackUrl } from "../../lib/demo/mode";

// /demo: the way in for visitors from Creative Universe (Cassidy, Nov 9).
// Two doors: an example person to look around, or a blank start with the
// welcome. Everything stays in this browser (lib/demo/mode.js).
//
// Entry key (planned, not built): if Cassidy wants a key in front of the
// demo, ask for it here before the two doors and check it in enterDemo().
export default function DemoGate() {
  const [busy, setBusy] = useState(null);
  const inDemo = isDemo();
  // Remembered from /demo?from=… before the first draw, so the way back shows at once.
  const [back] = useState(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) rememberBack(from);
    return demoBackUrl();
  });

  const go = kind => {
    setBusy(kind);
    enterDemo(kind).catch(() => setBusy(null));
  };

  return (
    <div className="min-h-dvh bg-bg text-textPrimary font-sans flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-[460px]">
        {back && (
          <a href={back} className="inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-textSecondary hover:text-textPrimary">
            <ArrowLeft size={16} strokeWidth={1.75} /> Back to Creative Universe
          </a>
        )}

        <img src="/logo-wordmark.png" alt="YOU — Your Own Universe" className="h-12 w-auto mx-auto mt-4" />
        <h1 className="font-serif text-hero font-semibold text-center mt-5 mb-2">Try YOU</h1>
        <p className="text-body text-textSecondary text-center m-0">
          A calm, private place to journal, grow habits and see your life take shape.
        </p>
        <p className="text-bodySm text-textMuted text-center mt-2 mb-6">
          This demo runs entirely in your browser with example data. Nothing you do here is sent anywhere.
        </p>

        {inDemo ? (
          <div className="rounded-card bg-surface1 shadow-card p-5 space-y-3">
            <p className="m-0 text-body">
              You're in the demo{demoKind() === "blank" ? ", starting blank" : ", as Wren"}.
            </p>
            <a href="/" className="flex items-center justify-center min-h-[48px] rounded-full bg-forestAccent text-onAccent text-body font-medium">
              Carry on
            </a>
            <div className="flex gap-2">
              <button type="button" onClick={() => resetDemo()} className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full border border-borderC text-bodySm">
                <RotateCcw size={15} strokeWidth={1.75} /> Reset demo
              </button>
              <button type="button" onClick={() => leaveDemo()} className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full border border-borderC text-bodySm">
                <LogOut size={15} strokeWidth={1.75} /> Leave demo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Door
              icon={UserRound}
              title="Explore as an example person"
              says="Meet Wren, a made-up Seeker a few weeks in: journal entries, habits, values and a little of their story."
              busy={busy === "example"}
              onClick={() => go("example")}
            />
            <Door
              icon={Sprout}
              title="Start blank"
              says="Begin as someone new, with the welcome and an empty universe to fill."
              busy={busy === "blank"}
              onClick={() => go("blank")}
            />
          </div>
        )}

        <p className="text-caption text-textMuted text-center mt-6 mb-0">
          AI reflections, photos and sending feedback need the real YOU, so they're switched off here.
          Leaving the demo clears everything it kept in this browser.
        </p>
      </div>
    </div>
  );
}

function Door({ icon: Icon, title, says, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={`${title}. ${says}`}
      className="w-full text-left rounded-card bg-surface1 shadow-card p-4 flex items-start gap-3.5 hover:bg-surface2 transition-colors disabled:opacity-70"
    >
      <span className="w-11 h-11 flex-none rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-gold">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-h3 font-semibold">{busy ? "Opening…" : title}</span>
        <span className="block text-bodySm text-textSecondary mt-0.5">{says}</span>
      </span>
    </button>
  );
}
