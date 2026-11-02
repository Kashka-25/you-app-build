import { useState } from "react";
import { Check, ChevronRight, Footprints, Lamp, Landmark, Lock, Sparkles, X } from "lucide-react";
import { PILLAR_ICONS } from "../../constants/pillarIcons";
import { COLOURWAYS, ITEMS, STYLES, colourwayById, itemArt, recolourable, slotById, styleById } from "../../lib/realmCatalog";
import { canBuy, isOpen, tierName } from "../../lib/rpg";
import { useEscape } from "../ui/useEscape";

const DECOR_ICONS = { lights: Lamp, path: Footprints, ornament: Landmark };
const iconFor = slot => PILLAR_ICONS[slot.pillar] || DECOR_ICONS[slot.id] || Sparkles;

// An item's picture: its painted layer when there is one, otherwise its
// emblem in its style's colour.
export function ItemLook({ realm, item, size = 30 }) {
  const slot = slotById(item.slot);
  const art = itemArt(item, realm.character?.id);
  const filter = colourwayById(realm.colours[item.id]).filter;
  if (art) return <img src={art} alt="" style={{ filter }} />;
  const Icon = iconFor(slot);
  const st = styleById(item.style);
  return (
    <span className="w-full h-full grid place-items-center" style={{ background: `radial-gradient(circle at 50% 42%, ${st?.colour || "#B9A27C"}88, #1E1230 74%)`, filter }}>
      <Icon size={size + item.tier * 5} strokeWidth={1.4} className="text-[#F3DBA0] drop-shadow-[0_0_8px_rgba(255,220,140,0.6)]" aria-hidden="true" />
    </span>
  );
}

// A slot as a row in its tab: what's there now, and a way into its catalog.
export function SlotRow({ realm, slotId, onOpen }) {
  const slot = slotById(slotId);
  const item = realm.equipped[slotId];
  const pillar = slot.pillar ? realm.byName[slot.pillar] : null;
  const shut = slot.rank !== undefined && realm.rank.index < slot.rank;
  const st = styleById(item?.style);
  return (
    <button type="button" onClick={onOpen} className="realm-frame w-full p-2.5 flex items-center gap-3 text-left" aria-label={`${slot.name}: browse the catalog`}>
      <span className="realm-item w-[58px] flex-none" style={{ borderRadius: 10 }}>
        <span className="look">{item ? <ItemLook realm={realm} item={item} size={22} /> : <Lock size={18} className="text-textMuted" aria-hidden="true" />}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block realm-title text-[18px] leading-tight">{slot.name}{pillar && <span className="text-textMuted text-[14px]"> · {slot.pillar} Lv. {pillar.level}</span>}</span>
        <span className="block text-caption text-textSecondary truncate">
          {shut ? `Opens at Path rank ${slot.rank + 1}` : item ? `${item.name}${st ? ` · ${st.name}` : ""}` : "Nothing placed yet"}
        </span>
      </span>
      {realm.fresh[slotId] && <span className="text-[10.5px] font-semibold bg-[#DDB76A] text-[#2A1606] rounded-full px-2 py-0.5 flex-none">New tier</span>}
      <ChevronRight size={18} className="text-textMuted flex-none" aria-hidden="true" />
    </button>
  );
}

// The catalog for one slot, as a sheet from the bottom: every tier, every
// style, what's owned, what's open, what's still to grow into.
export function CatalogSheet({ realm, slotId, onClose, onBought, onNote }) {
  useEscape(true, onClose);
  const slot = slotById(slotId);
  const [style, setStyle] = useState("all");
  const pillar = slot.pillar ? realm.byName[slot.pillar] : null;
  const items = ITEMS.filter(i => i.slot === slotId && (style === "all" || !i.style || i.style === style));
  const tiers = [...new Set(items.map(i => i.tier))];
  const equipped = realm.equipped[slotId];

  async function act(fn, el, okText) {
    try {
      if (await fn()) { if (okText) onNote(okText); if (el) onBought(el); }
    } catch (e) {
      console.error("[Realm] catalog action failed:", e);
      onNote("That didn't save. Check your connection and try again.");
    }
  }

  return (
    <div className="realm-sheet-scrim" onClick={onClose}>
      <div className="realm realm-sheet" role="dialog" aria-modal="true" aria-labelledby="realm-sheet-title" onClick={e => e.stopPropagation()} style={{ margin: 0, borderRadius: "22px 22px 0 0" }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div id="realm-sheet-title" className="realm-title text-[26px] leading-tight">{slot.name}</div>
            <div className="text-caption text-textMuted">
              {pillar ? `Grows with ${slot.pillar}: level ${pillar.level} opens up to ${tierName(Math.min(pillar.level, 4))}` : `Opens at Path rank ${slot.rank + 1}`}
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--realm-line)] px-3 py-1 flex-none">
            <i className="realm-coin" /><span className="realm-title text-[18px] tabular-nums">{realm.coins.toLocaleString()}</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 grid place-items-center rounded-full border border-[var(--realm-line)] flex-none"><X size={16} /></button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1">
          <button type="button" className="realm-chip" aria-pressed={style === "all"} onClick={() => setStyle("all")}>All styles</button>
          {STYLES.map(s => (
            <button key={s.id} type="button" className="realm-chip inline-flex items-center gap-1.5" aria-pressed={style === s.id} onClick={() => setStyle(s.id)}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.colour }} />{s.name}
            </button>
          ))}
        </div>
        {style !== "all" && <p className="text-caption text-textMuted mt-1">{styleById(style).blurb}.</p>}

        {slot.rank !== undefined && equipped && (
          <button type="button" onClick={() => act(() => realm.unequip(slotId).then(() => true), null, `${slot.name} cleared.`)} className="realm-chip mt-2">Take it away</button>
        )}

        {tiers.map(t => {
          const tierItems = items.filter(i => i.tier === t);
          const open = tierItems[0] && isOpen(realm, tierItems[0]);
          return (
            <section key={t} className="mt-4">
              <div className="flex items-baseline justify-between mb-2">
                <div className="realm-title text-[19px]">{slot.pillar ? tierName(t) : "Choose a style"}{slot.tiers ? <span className="text-textMuted text-[15px]"> · {slot.tiers[t]}</span> : null}</div>
                {!open && <span className="text-[11.5px] text-textMuted inline-flex items-center gap-1"><Lock size={11} aria-hidden="true" />{slot.pillar ? `${slot.pillar} level ${t}` : `Path rank ${slot.rank + 1}`}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {tierItems.map(item => {
                  const owned = realm.owned.has(item.id);
                  const on = equipped?.id === item.id;
                  const st = styleById(item.style);
                  return (
                    <div key={item.id} className={`realm-item ${on ? "on" : ""} ${!open ? "shut" : ""}`}>
                      <div className="look">
                        <ItemLook realm={realm} item={item} />
                        {on && <Check size={15} className="absolute top-1.5 right-1.5 text-[#7FCF8E]" aria-label="In use" />}
                      </div>
                      <div className="p-1.5 flex flex-col gap-1 flex-1">
                        <div className="text-[11.5px] leading-tight text-textSecondary">{st ? st.name : "Where you start"}</div>
                        {on ? (
                          <span className="text-[11px] text-[#7FCF8E]">In use</span>
                        ) : owned ? (
                          <button type="button" className="realm-btn small w-full" style={{ minHeight: 28, fontSize: 14 }}
                            onClick={() => act(() => realm.equip(item.id), null, `${item.name} placed.`)}>Use</button>
                        ) : (
                          <button type="button" className="realm-btn small w-full" style={{ minHeight: 28, fontSize: 14 }} disabled={!canBuy(realm, item)}
                            aria-label={`Buy ${st?.name || ""} ${item.name} for ${item.cost} coins`}
                            onClick={e => act(() => realm.buy(item.id), e.currentTarget, `${st?.name || ""} ${item.name} is yours.`)}>
                            <i className="realm-coin" style={{ width: 12, height: 12 }} />{item.cost}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {recolourable(equipped) && (
          <section className="mt-5 pt-4 border-t border-[var(--realm-line)]">
            <div className="realm-title text-[19px]">Colourway</div>
            <p className="text-caption text-textMuted">For your {equipped.name.toLowerCase()}. Free to change.</p>
            <div className="flex gap-2.5 mt-2" role="radiogroup" aria-label="Colourway">
              {COLOURWAYS.map(c => (
                <button key={c.id} type="button" role="radio" aria-checked={(realm.colours[equipped.id] || "natural") === c.id}
                  aria-pressed={(realm.colours[equipped.id] || "natural") === c.id} aria-label={c.name}
                  className="realm-swatch" style={{ background: c.swatch }}
                  onClick={() => act(() => realm.setColour(equipped.id, c.id).then(() => true))} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
