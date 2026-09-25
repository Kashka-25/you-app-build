import { useAppData } from "../../lib/AppDataContext";
import { SectionTitle, Pill, ExploreLink, Placeholder, DropdownSection } from "../Primitives";
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

      <DropdownSection title="Pillars">
        <PillarsPanel />
      </DropdownSection>

      <DropdownSection title="Values">
        <ValuesPanel />
      </DropdownSection>

      <div className="mt-4">
        <Placeholder label="avatar upgrade station">
          Sims/Fallout-style attribute-driven upgrades to your avatar, companion, and world — driven
          by Pillar/Value XP instead of just stat bars. Bigger design conversation before this gets
          built; this is a placeholder, same as Legacy Mode below.
        </Placeholder>
      </div>

      <div className="mt-2">
        <ExploreLink to="/legacy" label="legacy mode" sub={'"My Story" export — future, design only'} />
      </div>
    </div>
  );
}
