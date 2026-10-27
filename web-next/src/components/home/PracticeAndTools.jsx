import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { GlowBubble } from "../ui/GlowBubble";
import { LeafSprig } from "./Botanical";

// One practice for today: the first of the Seeker's own tools (hard-moment
// tools first, then the most recently used, as useCourseNow sorts them), or
// "Bring me back to myself" until they've unlocked any. Opening it never
// counts as doing it. Deep forest by day, deep cosmos by night.
export function PracticeCard({ tool }) {
  const practice = tool
    ? { name: tool.tool.name, about: tool.tool.about, Icon: tool.tool.icon || Compass, to: tool.to }
    : { name: "Bring me back to myself", about: "What am I trying to create with my life?", Icon: Compass, to: "/bring-me-back" };

  return (
    <section aria-labelledby="home-practice" className="relative overflow-hidden rounded-card shadow-card p-4 bg-gradient-to-br from-forest to-forestAccent">
      <LeafSprig className="pointer-events-none absolute -right-3 -bottom-5 w-20 text-cream opacity-15" />
      <LeafSprig flip className="pointer-events-none absolute right-12 -top-8 w-12 text-gold opacity-25" />
      <h2 id="home-practice" className="relative text-label uppercase text-[color-mix(in_srgb,var(--cream)_75%,transparent)] m-0 mb-3">A practice for today</h2>
      <div className="relative flex items-start gap-3.5">
        <GlowBubble icon={practice.Icon} size={52} />
        <div className="flex-1 min-w-0">
          <div className="font-serif text-h2 text-cream leading-snug">{practice.name}</div>
          {practice.about && (
            <p className="text-bodySm text-[color-mix(in_srgb,var(--cream)_82%,transparent)] m-0 mt-1 line-clamp-2">{practice.about}</p>
          )}
          <Link
            to={practice.to}
            className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-cream text-forest font-medium text-bodySm hover:bg-white active:scale-[0.98] transition"
          >
            Begin <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Each everyday place has its own card from the YOU set: the open book,
// the sun over the leaves, the winding path, the moon in the lotus.
// The art shows whole, with the name written underneath.
const TOOLS = [
  { to: "/reflections", label: "Journal", note: "Write it down", image: "/images/home/tool-journal.webp" },
  { to: "/focus", label: "Focus", note: "One thing, fully", image: "/images/home/tool-focus.webp" },
  { to: "/pursue", label: "PursYOUts", note: "What you're growing", image: "/images/home/tool-pursuits.webp" },
  { to: "/youniversity", label: "YOUniversity", note: "Guided journeys", image: "/images/home/tool-youniversity.webp" }
];

// The everyday places, one tap away.
export function QuickTools() {
  return (
    <section aria-labelledby="home-tools">
      <h2 id="home-tools" className="font-serif text-h3 text-textPrimary m-0 mb-2.5 px-0.5">Your tools</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {TOOLS.map(t => (
          <Link key={t.to} to={t.to} className="group block rounded-card overflow-hidden bg-surface1 shadow-card active:scale-[0.98] transition">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={t.image} alt="" width="520" height="370" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 dark:brightness-[0.8]" />
            </div>
            <div className="px-3 py-2.5">
              <div className="font-serif text-h3 text-textPrimary leading-tight">{t.label}</div>
              <div className="text-caption text-textSecondary">{t.note}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
