import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { useRealm } from "../../lib/rpg";
import { SectionTitle, ExploreLink } from "../Primitives";
import ValuesPanel from "../values/ValuesPanel";
import QuestionnaireFlow from "../questionnaires/QuestionnaireFlow";
import Realm from "../rpg/Realm";
import RpgQuests from "../rpg/RpgQuests";

// YOU is your character now (Cassidy, Nov 1): the Realm takes the place of
// the Pillars and Values sections. The Pillars live on as the character's
// stats and upgrades; Values keep their whole panel in their own tab.
export default function You() {
  const { profile } = useAppData();
  const realm = useRealm();
  const [dream, setDream] = useState({ open: false, pillar: null });

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>You</SectionTitle>
      <Realm
        realm={realm}
        fallbackName={profile?.name}
        onFreeDream={pillar => setDream({ open: true, pillar })}
        quests={({ openTab }) => <RpgQuests onOpenValues={() => openTab("values")} />}
        values={<ValuesPanel />}
      />

      <QuestionnaireFlow
        open={dream.open}
        onClose={() => setDream(d => ({ ...d, open: false }))}
        questionnaire="freeing_dream"
        pillar={dream.pillar}
      />

      <div className="mt-6">
        <ExploreLink to="/mirror" label="the mirror" sub="this year so far, and this week one year ago" />
        <ExploreLink to="/legacy" label="legacy" sub="your life, year by year" />
      </div>
    </div>
  );
}
