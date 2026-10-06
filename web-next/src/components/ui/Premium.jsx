import { Sparkles } from "lucide-react";

// The YOUnderstanding look for AI (and, later, premium) features. Kept in
// one place so every AI moment reads the same: black and gold, never the
// everyday forest green. Styles live in styles/tokens.css (.ai-*).

// A button that asks AI for something.
export function AiButton({ children, busy = false, disabled = false, size = "md", full = false, className = "", ...props }) {
  const pad = size === "sm" ? "min-h-[40px] px-4 text-bodySm" : "min-h-[48px] px-5 text-body";
  return (
    <button
      type="button"
      data-busy={busy}
      className={`ai-frame ai-sheen inline-flex items-center justify-center gap-2 rounded-sm font-medium shadow-card disabled:cursor-not-allowed ${pad} ${full ? "w-full" : ""} ${className}`}
      {...props}
      disabled={busy || disabled}
    >
      <Sparkles size={size === "sm" ? 15 : 17} strokeWidth={1.75} className="text-[#E8C877] flex-none" />
      <span className="ai-gold-text">{children}</span>
    </button>
  );
}

// A small gold label, e.g. "YOUnderstanding" or "Reflection".
export function AiLabel({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-label uppercase tracking-[0.12em] ${className}`}>
      <Sparkles size={12} strokeWidth={1.75} className="text-[#E8C877]" />
      <span className="ai-gold-text font-semibold">{children}</span>
    </span>
  );
}

// A card that holds something AI wrote.
export function AiCard({ children, className = "", ...props }) {
  return (
    <div className={`ai-card rounded-card p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// A quiet text link inside an AI card (Regenerate, Read it again…).
export function AiLink({ children, className = "", ...props }) {
  return (
    <button type="button" className={`text-caption text-[#B8B5D6] hover:text-[#F3DE9C] underline underline-offset-2 disabled:opacity-60 ${className}`} {...props}>
      {children}
    </button>
  );
}
