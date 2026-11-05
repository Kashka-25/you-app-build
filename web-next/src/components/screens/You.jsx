import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { DropdownSection } from "../Primitives";
import ValuesPanel from "../values/ValuesPanel";
import PillarsPanel from "../pillars/PillarsPanel";

// YOU: who you are, and what you're growing. A painted header like
// YOUrnal's, PursYOUts' and YOUrney's (Cassidy, Nov 5): the mirror holding
// the sun and the moon, the name, and the level grown into from everything
// you do. (It replaces a plain orb and a placeholder "companion" line.)
export default function You() {
  const { level } = useAppData();

  return (
    <div className="pt-1 pb-24 px-5">
      <section aria-labelledby="you-title" className="relative mt-3 mb-5 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/tool-mirror.webp"
          alt=""
          width="640"
          height="480"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_30%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/70 via-40% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/70" />
        <div className="relative flex flex-col justify-end min-h-[188px] p-4 pt-20">
          <h1 id="you-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">YOU</h1>
          <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">Who you are, and what you're growing.</p>
          <span className="mt-3 self-start inline-flex items-center gap-1.5 min-h-[30px] px-3 rounded-full bg-white/70 dark:bg-black/35 border border-borderC dark:border-white/15 text-caption text-textPrimary dark:text-cream backdrop-blur-sm">
            <Sparkles size={13} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
            {level.name}
            <span className="text-textMuted dark:text-cream/70">· your level, from all you do</span>
          </span>
        </div>
      </section>

      <DropdownSection title="Pillars" defaultOpen>
        <PillarsPanel />
      </DropdownSection>

      {/* Open by default, like Pillars (Cassidy, Oct 24). */}
      <DropdownSection title="Values" defaultOpen>
        <ValuesPanel />
      </DropdownSection>

      {/* The Mirror and Legacy now live in YOUrney (Cassidy, Nov 5): a year
          ago on Memories, and Your years opened from there. */}
    </div>
  );
}
