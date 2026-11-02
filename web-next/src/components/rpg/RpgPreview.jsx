import { useState } from "react";
import Realm from "./Realm";
import { realmActions, realmFrom } from "../../lib/rpg";
import { PILLAR_COLORS, PILLARS } from "../../constants/app.const";

// The Realm with sample numbers, for working on it locally without signing
// in (/rpg-preview, dev builds only). Nothing here is saved.
const SAMPLES = {
  "Day one": {},
  "Three months in": { Body: 180, Heart: 320, Mind: 310, Spirit: 160, Connection: 110, Purpose: 360, Play: 140, "Home & Earth": 230 },
  "A year in": { Body: 720, Heart: 640, Mind: 1100, Spirit: 520, Connection: 680, Purpose: 1050, Play: 400, "Home & Earth": 900 }
};

export default function RpgPreview() {
  const [sample, setSample] = useState("Three months in");
  const [saved, setSaved] = useState({});
  const xp = SAMPLES[sample];
  const pillars = PILLARS.map(name => ({ name, xp: xp[name] || 0, color: PILLAR_COLORS[name], active: 2, bestStreak: 5 }));
  const totalXP = pillars.reduce((s, p) => s + p.xp, 0);
  const realm = realmFrom({ pillars, totalXP, saved });
  const live = { ...realm, ...realmActions(realm, saved, async next => setSaved(next)) };
  const mode = m => document.documentElement.setAttribute("data-mode", m);

  return (
    <div className="min-h-dvh bg-bg font-sans text-textPrimary">
      <div className="max-w-[480px] mx-auto pt-4 pb-24 px-5">
        <div className="flex flex-wrap gap-1.5 mb-4 text-caption">
          {Object.keys(SAMPLES).map(s => (
            <button key={s} type="button" onClick={() => { setSample(s); setSaved(v => ({ character: v.character, heroName: v.heroName })); }}
              className={`rounded-full px-3 py-1 border border-borderC ${s === sample ? "bg-forestAccent text-onAccent" : ""}`}>{s}</button>
          ))}
          <button type="button" onClick={() => setSaved({})} className="rounded-full px-3 py-1 border border-borderC">First visit</button>
          <button type="button" onClick={() => mode("light")} className="rounded-full px-3 py-1 border border-borderC">Day</button>
          <button type="button" onClick={() => mode("dark")} className="rounded-full px-3 py-1 border border-borderC">Night</button>
        </div>
        <div className="font-serif text-h2 font-medium mb-2.5">You</div>
        <Realm
          realm={live}
          fallbackName="Cassidy"
          onFreeDream={() => {}}
          quests={<div className="realm-frame p-4 text-bodySm text-textSecondary">Quests show your real habits, goals, dreams and Trials once you're signed in.</div>}
          values={<div className="text-bodySm text-textSecondary">Your Values panel sits here, unchanged.</div>}
        />
      </div>
    </div>
  );
}
