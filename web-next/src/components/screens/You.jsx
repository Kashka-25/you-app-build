import { useAppData } from "../../lib/AppDataContext";
import { SectionTitle, Pill, ExploreLink, DropdownSection } from "../Primitives";
import ValuesPanel from "../values/ValuesPanel";
import PillarsPanel from "../pillars/PillarsPanel";
import { GlowBubble } from "../ui/GlowBubble";

export default function You() {
  const { level } = useAppData();

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>You</SectionTitle>
      <GlowBubble size={88} className="mx-auto mb-3" />
      <div className="text-center mb-5">
        <Pill>{level.name} — companion presence</Pill>
      </div>

      <DropdownSection title="Pillars" defaultOpen>
        <PillarsPanel />
      </DropdownSection>

      {/* Open by default, like Pillars (Cassidy, Oct 24). */}
      <DropdownSection title="Values" defaultOpen>
        <ValuesPanel />
      </DropdownSection>

      {/* The avatar upgrade station (attribute-driven upgrades from Pillar/Value
          XP) is still a design conversation; hidden for the beta. */}
      <div className="mt-6">
        <ExploreLink to="/mirror" label="the mirror" sub="this year so far, and this week one year ago" />
        <ExploreLink to="/legacy" label="legacy" sub="your life, year by year" />
      </div>
    </div>
  );
}
