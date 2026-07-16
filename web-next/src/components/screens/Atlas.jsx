import { Brain, Dumbbell, Sparkles, HeartHandshake, Palette, Target } from "lucide-react";
import { BackRow, SectionTitle } from "../Primitives";
import { HeroCard } from "../ui/Card";

const REGIONS = [
  { name: "Mind", icon: Brain },
  { name: "Body", icon: Dumbbell },
  { name: "Spirit", icon: Sparkles },
  { name: "Relationships", icon: HeartHandshake },
  { name: "Creativity", icon: Palette },
  { name: "Purpose", icon: Target }
];

export default function Atlas() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Living atlas</SectionTitle>

      <HeroCard
        eyebrow="Signature feature"
        title="Your Living World"
        subtitle="Regions grow greener as each life area develops."
        image="/images/atlas.jpg"
      />

      <div className="grid grid-cols-2 gap-3 mt-4">
        {REGIONS.map(r => (
          <div key={r.name} className="rounded-card bg-surface1 shadow-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface3 text-forestAccent flex items-center justify-center flex-none">
              <r.icon size={17} strokeWidth={1.75} />
            </div>
            <div className="text-body font-medium text-textPrimary">{r.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
