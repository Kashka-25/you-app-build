import { useAuth } from "./AuthContext";
import { useAppData } from "./AppDataContext";
import { localDateKey } from "./week";
import { getPillarLevel, INNER_PILLARS, LEVELS, PRESTIGE_LEVELS } from "../constants/app.const";
import { DECOR, SLOTS, TOP_TIER, defaultItem, itemById, slotById } from "./realmCatalog";

// The Realm: YOU as a life game (Cassidy, Nov 1). You pick a character; the
// eight Pillars are their stats. Each Pillar's level opens tiers of its
// slot's catalog (Body: outfits, Mind: relics, Spirit: auras, Heart: the
// companion's gear, the outer four: the Sanctuary's places); YOU Coins,
// which every XP also earns, buy what you choose. Crystals are rare, earned
// by levelling, and evolve the companion. Coins never buy growth, and
// nothing is ever taken away.

export const XP_PER_COIN = 4;
export const CRYSTALS_PER_LEVEL = 5;
export const tierName = level => PRESTIGE_LEVELS[Math.min(level, PRESTIGE_LEVELS.length - 1)].name;

const ART = "/images/realm";
export const REALM_ART = { scene: `${ART}/characters/alchemist-scene.webp`, sanctuary: `${ART}/sanctuary.webp`, companion: `${ART}/companion.webp` };

// Who you can be. Art is a 3:4 portrait (see public/images/realm/README.md).
export const CHARACTERS = [
  { id: "alchemist", name: "The Alchemist", line: "Turns whatever life hands them into something golden.", art: `${ART}/characters/alchemist.webp` },
  { id: "wayfinder", name: "The Wayfinder", line: "Walks ahead with a light for the path.", art: `${ART}/characters/wayfinder.png` },
  { id: "lanternbearer", name: "The Lantern-bearer", line: "Quiet, watchful, carrying a small steady flame.", art: `${ART}/characters/lanternbearer.png` },
  { id: "elder", name: "The Elder", line: "Has seen many seasons and still plants trees.", art: `${ART}/characters/elder.png` },
  { id: "botanist", name: "The Botanist", line: "Grows things, mends things, knows every herb.", art: `${ART}/characters/botanist.png` },
  { id: "scholar", name: "The Scholar", line: "Reads the world like a spellbook, wheels and all.", art: `${ART}/characters/scholar.png` }
];
export const characterById = id => CHARACTERS.find(c => c.id === id) || null;

// The companion's forms, evolved with Crystals once the Heart allows.
export const COMPANION_FORMS = [
  { name: "Pup", heart: 0, crystals: 0 },
  { name: "Grey Wolf", heart: 2, crystals: 30 },
  { name: "Spirit Wolf", heart: 4, crystals: 80 },
  { name: "Star Wolf", heart: 6, crystals: 150 }
];

// How close the quietest Pillar is to the strongest, as a percentage.
export function harmony(pillars) {
  const xs = pillars.map(p => p.xp || 0);
  const max = Math.max(0, ...xs);
  return max ? Math.round((Math.min(...xs) / max) * 100) : 0;
}

// Path ranks (Seedling to Elder) are the character's evolutions.
export function rankFor(totalXP) {
  let i = 0;
  LEVELS.forEach((l, j) => { if (totalXP >= l.xp) i = j; });
  return { ...LEVELS[i], index: i, of: LEVELS.length, next: LEVELS[i + 1] || null };
}

// Can this item be bought now? Its tier needs its Pillar's level (decor
// needs a Path rank), and it costs coins.
export function canBuy(realm, item) {
  if (!item || realm.owned.has(item.id)) return false;
  return isOpen(realm, item) && realm.coins >= item.cost;
}
export function isOpen(realm, item) {
  const slot = slotById(item.slot);
  if (slot.rank !== undefined) return realm.rank.index >= slot.rank;
  return item.tier <= realm.slotTier[item.slot];
}

// Everything the Realm shows, worked out from Pillar XP and what's been
// bought. Coins and Crystals come from lifetime effort, so past work counts
// from day one; only what's spent is stored.
export function realmFrom({ pillars: base, totalXP, saved = {} }) {
  const pillars = base.map(p => ({ ...p, ...getPillarLevel(p.xp || 0), inner: INNER_PILLARS.includes(p.name) }));
  const byName = Object.fromEntries(pillars.map(p => [p.name, p]));
  const levelSum = pillars.reduce((s, p) => s + p.level, 0);
  const rank = rankFor(totalXP);
  const owned = new Set([...SLOTS.map(s => `${s.id}-t0`), ...(saved.owned || []).filter(id => itemById(id))]);
  const equippedIds = saved.equipped || {};
  const equipped = {};
  [...SLOTS, ...DECOR].forEach(s => {
    const id = equippedIds[s.id];
    equipped[s.id] = id && owned.has(id) ? itemById(id) : s.rank !== undefined ? null : defaultItem(s.id);
  });
  const slotTier = Object.fromEntries(SLOTS.map(s => [s.id, Math.min(TOP_TIER, byName[s.pillar]?.level || 0)]));
  // Slots where a higher tier is open than anything owned there.
  const fresh = Object.fromEntries(SLOTS.map(s => {
    const best = Math.max(0, ...[...owned].map(itemById).filter(i => i.slot === s.id).map(i => i.tier));
    return [s.id, slotTier[s.id] > best];
  }));
  const heart = byName.Heart;
  const outer = SLOTS.filter(s => s.group === "sanctuary");
  const styles = outer.map(s => equipped[s.id]?.style);
  return {
    pillars, byName, totalXP, rank, level: levelSum, harmony: harmony(base),
    coins: Math.max(0, Math.floor(totalXP / XP_PER_COIN) - (saved.spent || 0)),
    crystals: Math.max(0, levelSum * 5 + rank.index * 10 - (saved.crystalsSpent || 0)),
    owned, equipped, slotTier, fresh, colours: saved.colours || {},
    character: characterById(saved.character),
    heroName: saved.heroName || "",
    companionName: saved.companionName || "Luna",
    companionForm: saved.companionForm || 0,
    heartLevel: heart?.level || 0,
    sanctuaryLevel: outer.reduce((s, sl) => s + (equipped[sl.id]?.tier || 0), 0),
    // All four places in one style: a full set.
    fullSet: styles.every(s => s && s === styles[0]) ? styles[0] : null
  };
}

// The season the chapter is named for, by the turning that began it.
export function currentChapter(hemisphere, today = localDateKey()) {
  const m = Number(today.slice(5, 7)), d = Number(today.slice(8, 10));
  const turns = [[3, 20], [6, 21], [9, 22], [12, 21]];
  let began = 12;
  turns.forEach(([tm, td]) => { if (m > tm || (m === tm && d >= td)) began = tm; });
  const names = hemisphere === "south"
    ? { 3: "Autumn", 6: "Winter", 9: "Spring", 12: "Summer" }
    : { 3: "Spring", 6: "Summer", 9: "Autumn", 12: "Winter" };
  const endMonth = began === 12 ? 3 : began + 3;
  const end = turns.find(([tm]) => tm === endMonth);
  const endsOn = new Date(2000, end[0] - 1, end[1]).toLocaleDateString(undefined, { day: "numeric", month: "long" });
  return { season: names[began], endsOn };
}

// What any Realm can do, given a way to save. The live one saves to the
// account's prefs; the preview keeps it in memory.
export function realmActions(realm, saved, save) {
  const put = patch => save({ ...saved, ...patch });
  const equippedIds = () => ({ ...(saved.equipped || {}) });
  return {
    async buy(id) {
      const item = itemById(id);
      if (!canBuy(realm, item)) return false;
      await put({
        owned: [...(saved.owned || []), id],
        equipped: { ...equippedIds(), [item.slot]: id },
        spent: (saved.spent || 0) + item.cost
      });
      return true;
    },
    async equip(id) {
      const item = itemById(id);
      if (!item || !realm.owned.has(id)) return false;
      await put({ equipped: { ...equippedIds(), [item.slot]: id } });
      return true;
    },
    // Decor can be taken away entirely; a main slot goes back to its start.
    unequip: slotId => put({ equipped: { ...equippedIds(), [slotId]: null } }),
    setColour: (id, colourway) => put({ colours: { ...(saved.colours || {}), [id]: colourway } }),
    async evolveCompanion() {
      const next = COMPANION_FORMS[realm.companionForm + 1];
      if (!next || realm.heartLevel < next.heart || realm.crystals < next.crystals) return false;
      await put({ companionForm: realm.companionForm + 1, crystalsSpent: (saved.crystalsSpent || 0) + next.crystals });
      return true;
    },
    chooseCharacter: (id, heroName) => put({ character: id, heroName: heroName ?? saved.heroName ?? "" }),
    nameCompanion: name => put({ companionName: name })
  };
}

// The live Realm for the signed-in Seeker, kept in prefs.rpg (no migration;
// prefs are the Seeker's own to edit, so nothing here is trusted for gifts
// between accounts: that needs a server-side ledger).
export function useRealm() {
  const { prefs, setPrefs } = useAuth();
  const { pillars, totalXP } = useAppData();
  const saved = prefs?.rpg || {};
  const realm = realmFrom({ pillars, totalXP, saved });
  return { ...realm, ...realmActions(realm, saved, next => setPrefs({ rpg: next })) };
}
