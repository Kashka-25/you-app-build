import { Footprints, Lamp, Landmark, Sparkles } from "lucide-react";
import { PILLAR_ICONS } from "../../constants/pillarIcons";
import { ART_READY, DECOR, colourwayById, itemArt, slotById, styleById } from "../../lib/realmCatalog";
import { REALM_ART } from "../../lib/rpg";

// The opening scene (Cassidy, Nov 1): your Sanctuary, your character and
// your companion, built from layers so each part changes as it upgrades.
// A slot with painted art shows it in its zone; until then it shows an
// emblem there that opens its catalog. Spirit's aura is drawn as light.
const DECOR_ICONS = { lights: Lamp, path: Footprints, ornament: Landmark };
// Back to front.
const ORDER = ["lights", "study", "pavilion", "gardens", "ornament", "path", "garb", "bond", "hearth", "relic"];

export default function RealmScene({ realm, onOpenSlot, children }) {
  const env = ART_READY.has("env-day") ? "/images/realm/items/env-day.png" : REALM_ART.sanctuary;
  const aura = realm.equipped.aura;
  const auraColour = styleById(aura?.style)?.colour || "#F3D58A";
  return (
    <div className="realm-scene" style={{ backgroundImage: `url(${env})` }}>
      {!ART_READY.has("env-day") && <div className="realm-scene-veil" aria-hidden="true" />}
      {ORDER.map(id => {
        const slot = slotById(id);
        if (id === "garb") return <Character key={id} realm={realm} aura={aura} auraColour={auraColour} />;
        if (id === "bond") return <CompanionLayer key={id} realm={realm} onOpen={() => onOpenSlot("bond")} />;
        const item = realm.equipped[id];
        if (DECOR.includes(slot) && !item) return null;
        return <Layer key={id} realm={realm} slot={slot} item={item} onOpen={() => onOpenSlot(id)} />;
      })}
      {children}
    </div>
  );
}

const zoneStyle = ([x, y, w, h]) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });

function Layer({ realm, slot, item, onOpen }) {
  const art = itemArt(item, realm.character?.id);
  const filter = colourwayById(realm.colours[item?.id]).filter;
  if (art) {
    return (
      <button type="button" onClick={onOpen} className="realm-layer" style={zoneStyle(slot.zone)} aria-label={`${slot.name}: ${item.name}`}>
        <img src={art} alt="" style={{ filter }} />
      </button>
    );
  }
  const [px, py] = slot.pin;
  const Icon = PILLAR_ICONS[slot.pillar] || DECOR_ICONS[slot.id] || Sparkles;
  const style = styleById(item?.style);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`realm-pin ${slot.id === "relic" ? "bob" : ""}`}
      style={{ left: `${px}%`, top: `${py}%` }}
      aria-label={`${slot.name}: ${item?.name}. Open the catalog`}
    >
      <span className="disc" style={{ background: `radial-gradient(circle at 50% 38%, ${style?.colour || "#D9C29A"}cc, #2A1A3C 78%)`, filter }}>
        <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
      </span>
      {realm.fresh[slot.id] && <span className="new" aria-hidden="true">✦</span>}
      <span className="lbl">{slot.name}</span>
      {item?.tier > 0 && <span className="pips" aria-hidden="true">{"◆".repeat(item.tier)}</span>}
    </button>
  );
}

// The character, with the light their Spirit gives them.
function Character({ realm, aura, auraColour }) {
  const slot = slotById("garb");
  const item = realm.equipped.garb;
  const art = itemArt(item, realm.character?.id);
  const tier = aura?.tier || 0;
  return (
    <div className="realm-hero-layer" style={zoneStyle(slot.zone)}>
      {tier >= 1 && <div className="realm-aura" style={{ background: `radial-gradient(closest-side, ${auraColour}88, transparent)` }} aria-hidden="true" />}
      {tier >= 4 && <div className="realm-halo" style={{ borderColor: auraColour, boxShadow: `0 0 18px ${auraColour}` }} aria-hidden="true" />}
      {art ? (
        <img src={art} alt={realm.character.name} className="realm-hero-art" />
      ) : (
        <div className="realm-arch" style={{ backgroundImage: `url(${realm.character.art})` }} role="img" aria-label={realm.character.name} />
      )}
      {tier >= 3 && (
        <div className="realm-crown" aria-hidden="true" style={{ color: auraColour }}>
          <Sparkles size={14} /><Sparkles size={18} /><Sparkles size={14} />
        </div>
      )}
      {tier >= 2 && (
        <div className="realm-flies" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${20 + ((i * 23) % 70)}%`, background: auraColour, boxShadow: `0 0 8px ${auraColour}`, animationDelay: `${-i * 0.6}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// The companion's picture follows its form (Pup to Star Wolf); its gear
// sits beside it as an object of its own.
function CompanionLayer({ realm, onOpen }) {
  const slot = slotById("bond");
  const formId = `comp-wolf-${realm.companionForm}`;
  const form = ART_READY.has(formId) ? `/images/realm/items/${formId}.png` : null;
  const gear = realm.equipped.bond;
  const gearArt = itemArt(gear, realm.character?.id);
  return (
    <button type="button" onClick={onOpen} className="realm-companion-layer" style={zoneStyle(slot.zone)} aria-label={`${realm.companionName}: open the companion's catalog`}>
      {form ? <img src={form} alt="" /> : <span className="realm-companion-disc" style={{ backgroundImage: `url(${REALM_ART.companion})` }} />}
      {gearArt && <img src={gearArt} alt="" className="realm-gear" style={{ filter: colourwayById(realm.colours[gear.id]).filter }} />}
      {realm.fresh.bond && <span className="new" aria-hidden="true">✦</span>}
    </button>
  );
}

