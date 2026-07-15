import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "../../../lib/AppDataContext";
import { getTier, VALUE_PILLAR, VALUE_PILLAR2 } from "../../../constants/app.const";
import { ALL_VALUES_LIB } from "../../../constants/values.const";
import { SectionTitle } from "../../Primitives";

export default function TreeDetail({ onBack }) {
  const { pillars, values } = useAppData();
  const [selectedRoot, setSelectedRoot] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState(null);

  // All 12 Values always show as roots, even ones the user hasn't added yet
  // (structure matters more than content right now) — those just sit at
  // the lowest tier until engaged with.
  const roots = ALL_VALUES_LIB.map(lib => {
    const owned = values.find(v => v.name === lib.name);
    const rating = owned?.rating || 0;
    return { name: lib.name, rating, tier: getTier(rating) };
  });

  function feedsFromRoot(rootName) {
    return [VALUE_PILLAR[rootName], VALUE_PILLAR2[rootName]].filter(Boolean);
  }
  function rootsFeedingPillar(pillarName) {
    return roots.filter(r => VALUE_PILLAR[r.name] === pillarName || VALUE_PILLAR2[r.name] === pillarName).map(r => r.name);
  }

  const highlightedPillars = selectedRoot ? feedsFromRoot(selectedRoot) : selectedPillar ? [selectedPillar] : null;
  const highlightedRoots = selectedPillar ? rootsFeedingPillar(selectedPillar) : selectedRoot ? [selectedRoot] : null;

  function tapRoot(name) {
    setSelectedPillar(null);
    setSelectedRoot(prev => (prev === name ? null : name));
  }
  function tapPillar(name) {
    setSelectedRoot(null);
    setSelectedPillar(prev => (prev === name ? null : name));
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-bodySm text-textSecondary mb-2">
        <ArrowLeft size={16} strokeWidth={1.75} />
        Back
      </button>
      <SectionTitle>Tree of YOU</SectionTitle>
      <div className="text-bodySm text-textSecondary -mt-1 mb-4">
        Roots are your Values, branches are your Pillars. Tap either to see what feeds what.
      </div>

      <div className="rounded-card bg-surface1 shadow-card p-4 mb-2">
        <div className="text-label uppercase text-textMuted mb-2.5">Canopy — your Pillars</div>
        <div className="flex flex-wrap gap-2">
          {pillars.map(p => {
            const active = highlightedPillars?.includes(p.name);
            const dimmed = highlightedPillars && !active;
            return (
              <button
                key={p.name}
                onClick={() => tapPillar(p.name)}
                className={`px-3 py-2 rounded-full text-bodySm font-medium transition-all duration-200 ${
                  dimmed ? "opacity-35" : ""
                } ${active ? "ring-2 ring-gold" : ""}`}
                style={{ background: `${p.color}33`, color: p.color }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center py-1">
        <div className="w-px h-6 bg-borderC" />
      </div>

      <div className="rounded-card bg-surface1 shadow-card p-4">
        <div className="text-label uppercase text-textMuted mb-2.5">Roots — your Values</div>
        <div className="flex flex-wrap gap-2">
          {roots.map(r => {
            const active = highlightedRoots?.includes(r.name);
            const dimmed = highlightedRoots && !active;
            return (
              <button
                key={r.name}
                onClick={() => tapRoot(r.name)}
                className={`px-3 py-2 rounded-full text-bodySm font-medium transition-all duration-200 ${
                  dimmed ? "opacity-35" : ""
                } ${active ? "ring-2 ring-gold" : ""}`}
                style={{ background: `${r.tier.color}33`, color: r.tier.color }}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-bodySm text-textSecondary mt-4 min-h-[20px]">
        {selectedRoot && `${selectedRoot} feeds → ${feedsFromRoot(selectedRoot).join(", ") || "nothing yet"}`}
        {selectedPillar && `${selectedPillar} is fed by → ${rootsFeedingPillar(selectedPillar).join(", ") || "no values yet"}`}
        {!selectedRoot && !selectedPillar && "Tap a root or a branch to trace the connection."}
      </div>
    </div>
  );
}
