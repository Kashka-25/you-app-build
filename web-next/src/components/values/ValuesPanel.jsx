import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { getTier, TIERS } from "../../constants/app.const";
import { ALL_VALUES_LIB } from "../../constants/values.const";

const SEGMENTS = 10;

export default function ValuesPanel() {
  const { values, addValue, completeChallenge } = useAppData();
  const [activeIdx, setActiveIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [diff, setDiff] = useState("all");

  const active = values[activeIdx];
  const activeLib = active ? ALL_VALUES_LIB.find(v => v.name === active.name) : null;

  const available = ALL_VALUES_LIB.filter(v => !values.some(x => x.name === v.name));

  async function handleAddValue(name) {
    await addValue(name);
    setActiveIdx(values.length);
    setAdding(false);
  }

  if (values.length === 0) {
    return (
      <div>
        <div className="text-[13px] text-textMuted mb-3">No values selected yet.</div>
        <AddValueButton adding={adding} setAdding={setAdding} available={available} onPick={handleAddValue} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {values.map((v, i) => {
          const tier = getTier(v.rating);
          const filled = Math.round((v.rating / 99) * SEGMENTS);
          return (
            <div
              key={v.name}
              onClick={() => setActiveIdx(i)}
              className={`cursor-pointer p-2.5 rounded-lg ${i === activeIdx ? "bg-surface3" : ""}`}
            >
              <div className="flex justify-between text-[13px] mb-1">
                <span className="font-medium">{v.name}</span>
                <span style={{ color: tier.color }}>{tier.name} · {v.rating}</span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: SEGMENTS }).map((_, si) => (
                  <div key={si} className="flex-1 h-2 rounded-sm" style={{ background: si < filled ? tier.color : "var(--surface-3)" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeLib && (
        <div>
          <div className="text-[13px] text-textMuted mb-1">{activeLib.tagline}</div>
          <div className="flex gap-1.5 mb-3">
            {["all", "gentle", "bold", "brave"].map(d => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`text-[11px] px-2.5 py-1 rounded-full ${diff === d ? "bg-forestAccent text-surface2" : "bg-surface3 text-textMuted"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {activeLib.challenges
              .map((c, idx) => ({ ...c, idx }))
              .filter(c => diff === "all" || c.diff === diff)
              .map(c => {
                const done = (active.completed || []).includes(c.idx);
                return (
                  <div key={c.idx} className={`flex items-center gap-2.5 p-2.5 rounded-lg bg-surface1 ${done ? "opacity-50" : ""}`}>
                    <button
                      onClick={() => !done && completeChallenge(active.name, c.idx)}
                      disabled={done}
                      className={`w-6 h-6 flex-none rounded-full border text-[12px] ${done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                    >
                      {done ? "✓" : ""}
                    </button>
                    <div className="flex-1 text-[13px]">{c.text}</div>
                    <div className="text-[12px] text-gold flex-none">+{c.pts}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="mt-4">
        <AddValueButton adding={adding} setAdding={setAdding} available={available} onPick={handleAddValue} />
      </div>
    </div>
  );
}

function AddValueButton({ adding, setAdding, available, onPick }) {
  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} className="text-[13px] border border-borderC rounded-lg px-3 py-2 w-full text-textSecondary">
        + Add a value
      </button>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {available.map(v => (
        <button key={v.name} onClick={() => onPick(v.name)} className="text-[13px] border border-borderC rounded-lg px-3 py-2 text-left">
          {v.icon} {v.name}
        </button>
      ))}
    </div>
  );
}
