import { useAppData } from "../../lib/AppDataContext";
import { SectionTitle, Pill, ExploreLink, Placeholder } from "../Primitives";
import ValuesPanel from "../values/ValuesPanel";
import PillarsPanel from "../pillars/PillarsPanel";

export default function You() {
  const { level } = useAppData();

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>You</SectionTitle>
      <div
        className="w-[88px] h-[88px] rounded-full mx-auto mb-3"
        style={{ background: "radial-gradient(circle at 35% 30%, var(--sage), var(--forest) 70%)" }}
      />
      <div className="text-center mb-5">
        <Pill>{level.name} — companion presence</Pill>
      </div>

      <SectionTitle>Pillars</SectionTitle>
      <PillarsPanel />

      <SectionTitle>Values</SectionTitle>
      <ValuesPanel />

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
