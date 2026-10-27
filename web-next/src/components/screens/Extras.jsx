import { useState } from "react";
import { Lock, Plus, RotateCcw } from "lucide-react";
import { SectionTitle } from "../Primitives";
import { PLUGINS, useSetPlugin } from "../../lib/plugins";
import { useNavigation } from "../../lib/navigation";
import { PluginRow } from "./Settings";

// Extras (Cassidy, Oct 27): one place to shape your own YOU. The optional
// extras, which places show in the side menu, and which two sit in the
// bottom bar beside Home and YOU. Everything is per account.

function Emblem({ icon, size = 36 }) {
  return <img src={`/images/icons/${icon}.png`} alt="" width={size} height={size} style={{ width: size, height: size }} className="flex-none" />;
}

function Card({ title, lead, children }) {
  return (
    <section className="rounded-card bg-surface1 shadow-card px-4 py-3 mb-5">
      <h2 className="font-serif text-h3 text-textPrimary mt-1 mb-0.5">{title}</h2>
      {lead && <p className="text-caption text-textMuted mb-2">{lead}</p>}
      {children}
    </section>
  );
}

function Switch({ on, onClick, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex-none inline-flex items-center gap-2 min-h-[36px] px-3 rounded-full text-caption font-medium border ${on ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"}`}
    >
      <span className={`w-2 h-2 rounded-full ${on ? "bg-onAccent" : "bg-textMuted"}`} aria-hidden="true" />
      {on ? "Shown" : "Hidden"}
    </button>
  );
}

export default function Extras() {
  const setPlugin = useSetPlugin();
  const nav = useNavigation();
  const [error, setError] = useState("");
  const run = p => Promise.resolve(p).catch(e => { console.error("[Extras] save failed:", e); setError("Couldn't save that just now. Check your connection and try again."); });
  const [spot, setSpot] = useState(0);

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>Extras</SectionTitle>
      <p className="text-body text-textSecondary mb-5">
        Make YOU yours: add extras, and choose what shows in your side menu and on the bar at the bottom.
      </p>
      {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}

      <Card title="Your extras" lead="Optional parts you can add or take away whenever you like. New extras appear here.">
        {PLUGINS.map(p => <PluginRow key={p.key} plugin={p} onChange={on => setPlugin(p.key, on)} />)}
      </Card>

      <Card title="Your bottom bar" lead="Home, Add and YOU always stay. Choose the two places either side of Add.">
        {/* A small picture of the bar as it is now. */}
        <div className="flex items-end justify-around rounded-sm border border-borderC bg-surface2 px-1 pt-2 pb-1.5 mb-3" aria-hidden="true">
          {[
            { label: "Home", icon: "home" },
            { label: nav.bar[0].label, icon: nav.bar[0].icon, spot: 0 },
            { add: true },
            { label: nav.bar[1].label, icon: nav.bar[1].icon, spot: 1 },
            { label: "YOU", icon: "you" }
          ].map((t, i) => (
            <div key={i} className={`flex-1 min-w-0 text-center text-[10px] leading-tight ${t.spot === spot ? "text-forestAccent font-medium" : "text-textMuted"}`}>
              {t.add ? (
                <span className="w-7 h-7 rounded-full bg-forestAccent mx-auto mb-1 flex items-center justify-center"><Plus size={14} strokeWidth={2} className="text-onAccent" /></span>
              ) : (
                <span className={`block mx-auto mb-0.5 w-fit rounded-full ${t.spot === spot ? "ring-2 ring-gold ring-offset-1 ring-offset-surface2" : ""}`}><Emblem icon={t.icon} size={26} /></span>
              )}
              <span className="block truncate">{t.add ? "Add" : t.label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-2" role="tablist" aria-label="Which spot">
          {["Left of Add", "Right of Add"].map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={spot === i}
              onClick={() => setSpot(i)}
              className={`flex-1 min-h-[36px] rounded-full text-caption ${spot === i ? "bg-forestAccent text-onAccent font-medium" : "text-textSecondary border border-borderC"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={spot === 0 ? "Left of Add" : "Right of Add"}>
          {nav.available.filter(p => !p.locked).map(p => {
            const here = nav.bar[spot].key === p.key;
            const other = nav.bar[1 - spot].key === p.key;
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={here}
                onClick={() => !here && run(nav.setBarSpot(spot, p.key))}
                className={`rounded-sm border p-2 text-center text-caption ${here ? "border-forestAccent bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-textPrimary font-medium" : "border-borderC text-textSecondary hover:text-textPrimary"}`}
              >
                <span className="block mx-auto w-fit mb-1"><Emblem icon={p.icon} size={32} /></span>
                <span className="block truncate">{p.label}</span>
                {other && <span className="block text-[10px] text-textMuted">(other spot · swaps)</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Your side menu" lead="Hide what you don't use; it's still there to bring back any time. Home and YOU always stay.">
        {nav.available.map(p => (
          <div key={p.key} className="flex items-center gap-3 py-2 border-b border-borderC last:border-b-0">
            <Emblem icon={p.icon} size={34} />
            <span className="flex-1 min-w-0 text-body text-textPrimary truncate">{p.label}</span>
            {p.locked ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-textMuted min-h-[36px] px-3">
                <Lock size={13} strokeWidth={1.75} /> Always
              </span>
            ) : (
              <Switch on={!nav.isHidden(p.key)} label={`Show ${p.label} in the side menu`} onClick={() => run(nav.setShown(p.key, nav.isHidden(p.key)))} />
            )}
          </div>
        ))}
        <p className="text-caption text-textMuted mt-2 mb-1">
          Your Own Universe, Extras, What's new and Find your way always stay at the bottom of the menu.
        </p>
      </Card>

      {!nav.isDefault && (
        <button
          type="button"
          onClick={() => run(nav.reset())}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-borderC text-bodySm text-textPrimary"
        >
          <RotateCcw size={15} strokeWidth={1.75} /> Back to the usual menu and bar
        </button>
      )}
    </div>
  );
}
