// The Realm's catalog (Cassidy, Nov 1): like The Sims, every place on the
// character and in the Sanctuary is a slot, and reaching a Pillar level
// opens a shelf of choices for that slot, one in each style set. You buy
// what you like with YOU Coins, keep it in your inventory, swap it any
// time, and give furniture a colourway.
//
// Art: an item shows its painted layer once its file exists and its id is
// listed in ART_READY (see design/realm-art-brief.md for names and sizes);
// until then the scene shows its emblem in the same spot.

export const STYLES = [
  { id: "cottage", name: "Cottage", colour: "#D99A6C", blurb: "Timber, thatch and wildflowers" },
  { id: "elven", name: "Elven", colour: "#86C98F", blurb: "Living wood, silver and leaf" },
  { id: "desert", name: "Desert", colour: "#E3AE5C", blurb: "Sandstone, brass and silk" },
  { id: "coastal", name: "Coastal", colour: "#8EC4C2", blurb: "Driftwood, shells and sea-glass" },
  { id: "celestial", name: "Celestial", colour: "#C29DF0", blurb: "Moonstone, starlight and gold" }
];
export const styleById = id => STYLES.find(s => s.id === id) || null;

// Where things go. `pillar` is what unlocks its tiers; `group` is the tab
// it lives under; `zone` is its place on the scene, in % of the 4:5 canvas
// (x, y, width, height), matching the art brief; `pin` is where its emblem
// sits until its art arrives.
export const SLOTS = [
  { id: "garb", name: "Outfit", pillar: "Body", group: "wardrobe", zone: [28, 28, 40, 69],
    tiers: ["Traveller's linen", "Sashed tunic", "Booted traveller", "Cloaked wanderer", "Mantled regalia"] },
  { id: "relic", pin: [27, 47], name: "Relic", pillar: "Mind", group: "wardrobe", zone: [18, 30, 16, 18],
    tiers: ["Empty hands", "Journal", "Lantern", "Staff", "Orrery staff"] },
  { id: "aura", name: "Aura", pillar: "Spirit", group: "wardrobe", effect: true,
    tiers: ["No aura yet", "Soft aura", "Fireflies", "Crown of stars", "Halo"] },
  { id: "bond", name: "Companion's gear", pillar: "Heart", group: "companion", zone: [58, 68, 26, 29],
    tiers: ["Nothing yet", "Bond collar", "Gem collar", "Draped cloth", "Star mantle"] },
  { id: "study", pin: [20, 30], name: "Study", pillar: "Purpose", group: "sanctuary", zone: [2, 14, 42, 42],
    tiers: ["Lean-to", "Writing hut", "Study", "Map-room study", "Observatory tower"] },
  { id: "pavilion", pin: [78, 32], name: "Pavilion", pillar: "Play", group: "sanctuary", zone: [56, 18, 42, 38],
    tiers: ["Flute on a stump", "Painting easel", "Gazebo", "Domed pavilion", "Festival pavilion"] },
  { id: "gardens", pin: [84, 66], name: "Gardens", pillar: "Home & Earth", group: "sanctuary", zone: [55, 48, 45, 48],
    tiers: ["Bare soil", "Sprout beds", "Waterfall garden", "Fruit grove", "Crystal greenhouse"] },
  { id: "hearth", pin: [15, 76], name: "Hearth", pillar: "Connection", group: "sanctuary", zone: [0, 60, 42, 38],
    tiers: ["Log stool", "Fire pit", "Fireside lounge", "Feasting table", "Gathering hall"] }
];
// Small things that make a home yours, opened by Path rank.
export const DECOR = [
  { id: "lights", pin: [50, 21], name: "Lights", rank: 1, cost: 30, zone: [6, 8, 88, 14], noun: "Lanterns" },
  { id: "path", pin: [42, 80], name: "Path", rank: 2, cost: 50, zone: [34, 82, 32, 16], noun: "Garden path" },
  { id: "ornament", pin: [86, 48], name: "Ornament", rank: 3, cost: 70, zone: [44, 46, 12, 14], noun: "Statue" }
];
export const slotById = id => SLOTS.find(s => s.id === id) || DECOR.find(d => d.id === id) || null;

export const TOP_TIER = 4;
export const TIER_COST = [0, 20, 45, 80, 130];

// Colourways for furniture and gear (not the character's own outfit, which
// would tint their skin too). Applied as a filter on the painted layer.
export const COLOURWAYS = [
  { id: "natural", name: "Natural", swatch: "#C9A77A", filter: "none" },
  { id: "plum", name: "Plum", swatch: "#8E5BB8", filter: "hue-rotate(255deg) saturate(1.15)" },
  { id: "sage", name: "Sage", swatch: "#7FAF83", filter: "hue-rotate(70deg) saturate(.85)" },
  { id: "rose", name: "Rose", swatch: "#D98699", filter: "hue-rotate(320deg) saturate(1.1)" },
  { id: "midnight", name: "Midnight", swatch: "#5F6AA8", filter: "hue-rotate(200deg) brightness(.85)" }
];
export const colourwayById = id => COLOURWAYS.find(c => c.id === id) || COLOURWAYS[0];

// Every item: tier 0 of each slot is where everyone starts (free, owned);
// tiers 1–4 come in each style; decor comes in each style once.
export const ITEMS = [
  ...SLOTS.flatMap(slot => [
    { id: `${slot.id}-t0`, slot: slot.id, tier: 0, style: null, name: slot.tiers[0], cost: 0 },
    ...[1, 2, 3, 4].flatMap(tier => STYLES.map(st => ({
      id: `${slot.id}-t${tier}-${st.id}`, slot: slot.id, tier, style: st.id, name: slot.tiers[tier], cost: TIER_COST[tier]
    })))
  ]),
  ...DECOR.flatMap(d => STYLES.map(st => ({
    id: `${d.id}-${st.id}`, slot: d.id, tier: 1, style: st.id, name: d.noun, cost: d.cost, rank: d.rank
  })))
];
export const itemById = id => ITEMS.find(i => i.id === id) || null;
export const defaultItem = slotId => itemById(`${slotId}-t0`);
export const recolourable = item => Boolean(item && item.style && item.slot !== "garb" && item.slot !== "aura");

// Painted layers that exist so far (file at /images/realm/items/<id>.png,
// or for outfits /images/realm/characters/<character>/<id>.png). Add ids
// here as the art arrives.
export const ART_READY = new Set([]);
export function itemArt(item, characterId) {
  if (!item || !ART_READY.has(item.slot === "garb" ? `${characterId}/${item.id}` : item.id)) return null;
  return item.slot === "garb" ? `/images/realm/characters/${characterId}/${item.id}.png` : `/images/realm/items/${item.id}.png`;
}
