import { BackRow, SectionTitle } from "../Primitives";
import { HeroCard } from "../ui/Card";
import { PILLARS } from "../../constants/app.const";
import { PILLAR_ICONS } from "../../constants/pillarIcons";

// One region per Pillar, so the Atlas grows from the same taxonomy as
// everything else.
const REGIONS = PILLARS.map(name => ({ name, icon: PILLAR_ICONS[name] }));

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
