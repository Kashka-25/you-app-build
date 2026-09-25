// app.const.js — ported from js/config.js, unchanged values/logic.

export const LEVELS = [
  {xp:0,name:"Seedling",desc:"You have just arrived. A quiet glow. The universe has noticed you.",avatar:"SEED"},
  {xp:100,name:"Ember",desc:"Something is stirring. Roots have taken hold. Your inner fire awakens.",avatar:"EMBER"},
  {xp:250,name:"Wanderer",desc:"You have found your feet. Curious and unbound, moving with open eyes.",avatar:"WANDER"},
  {xp:500,name:"Seeker",desc:"You stand upright. A small flame burns in your chest, visible now.",avatar:"SEEKER"},
  {xp:900,name:"Alchemist",desc:"You are transforming everything you touch. The work is sacred now.",avatar:"ALCH"},
  {xp:1500,name:"Sage",desc:"You have become rooted like an ancient tree. Others feel safe near you.",avatar:"SAGE"},
  {xp:2500,name:"Oracle",desc:"Barely corporeal. More light than form. You see across time.",avatar:"ORACLE"},
  {xp:4000,name:"Elder",desc:"The cycle is complete. You are the light that plants new universes.",avatar:"ELDER"}
];

export const XP_VALS = { habit: 10, goal: 25, dream: 50 };
export const STREAK_BONUS_XP = 15;
export const STREAK_BONUS_INTERVAL = 7;
export const DAY_LABELS = ["M","T","W","T","F","S","S"];

export const PILLAR_COLORS = {
  Body:"#c4783a", Mind:"#7a8c5e", Spirit:"#d4a85a", Relationships:"#9a8870",
  Work:"#6478a0", Adventure:"#a06448", Creative:"#a06490"
};

export const PILLARS = ["Body","Mind","Spirit","Relationships","Work","Adventure","Creative"];

export const VALUE_PILLAR = {
  Communication:"Relationships", Courage:"Spirit", Presence:"Mind", Boundaries:"Relationships",
  Discipline:"Body", Empathy:"Relationships", Curiosity:"Mind", Rest:"Body",
  Integrity:"Work", Creativity:"Creative", Vulnerability:"Spirit", Gratitude:"Spirit",
  Family:"Relationships"
};
export const VALUE_PILLAR2 = { Discipline:"Work", Empathy:"Spirit", Curiosity:"Adventure" };

// One distinct color per value, purely for the icon bubble — VALUE_PILLAR
// maps several values onto the same pillar (e.g. Courage/Vulnerability/
// Gratitude all land on Spirit), so it can't double as a "make every value
// visually distinct" palette. Hues are spaced 30° apart around the wheel at
// the same muted saturation/lightness as the rest of the palette, so all 12
// are guaranteed distinct while still reading as one family of colors.
export const VALUE_COLORS = {
  Vulnerability: "hsl(0, 38%, 55%)",
  Courage: "hsl(30, 45%, 55%)",
  Gratitude: "hsl(60, 40%, 50%)",
  Discipline: "hsl(90, 30%, 45%)",
  Presence: "hsl(120, 25%, 42%)",
  Curiosity: "hsl(150, 32%, 42%)",
  Rest: "hsl(180, 30%, 42%)",
  Boundaries: "hsl(210, 35%, 52%)",
  Integrity: "hsl(240, 30%, 55%)",
  Empathy: "hsl(270, 28%, 55%)",
  Creativity: "hsl(300, 30%, 50%)",
  Communication: "hsl(330, 35%, 55%)",
  // Added later, alongside the original 12 -- doesn't disturb their evenly-
  // spaced hues, just sits at its own distinct point between Vulnerability
  // and Courage.
  Family: "hsl(15, 40%, 54%)"
};

export const TIERS = [
  {min:0,max:25,name:"Awakening",color:"#9a8870"},
  {min:26,max:50,name:"Practising",color:"#c4783a"},
  {min:51,max:75,name:"Embodying",color:"#d4a85a"},
  {min:76,max:99,name:"Mastering",color:"#7a8c5e"}
];

export function getTier(rating){
  for (const t of TIERS) if (rating >= t.min && rating <= t.max) return t;
  return TIERS[0];
}

export function getLevel(xp){
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xp) current = l; }
  return current;
}

export const PILLAR_LEVEL_XP = 100;

// The one "prestige ladder" formula shared across Pillars, Values, and
// (later) the avatar level-up: hit the cap, cycle back to 0, and the next
// cycle needs more than the last (cycle N, 0-indexed, needs
// baseRequirement * (N+1)) — rather than every cycle taking the same
// effort forever. Pillars use this today; Values' prestige and the future
// avatar level-up are meant to plug into this same function rather than
// invent their own pacing, so "prestige" means the same thing everywhere.
export function getPrestigeLevel(xp, baseRequirement = 100) {
  let level = 0;
  let remaining = xp;
  let requirement = baseRequirement;
  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement = baseRequirement * (level + 1);
  }
  const pct = Math.round((remaining / requirement) * 100);
  return { level, progress: remaining, pct, requirement };
}

export function getPillarLevel(xp) {
  return getPrestigeLevel(xp, PILLAR_LEVEL_XP);
}

// How much a given prestige cycle needs to complete — cycle 0 (first time
// through) needs baseRequirement, cycle 1 needs 2x, etc. Values track
// "progress within the current cycle" directly (rather than lifetime xp),
// so this is what tells the progress bar/tier lookup what 100% looks like.
export function prestigeRequirement(prestige, baseRequirement = 100) {
  return baseRequirement * (prestige + 1);
}

// Adds `gain` to a value already sitting at `current` progress within
// prestige cycle `prestige`. Overflow carries into the next (harder) cycle
// instead of capping at a fixed ceiling, so a value can never "max out" --
// it just keeps prestiging.
export function applyPrestigeGain(current, prestige, gain, baseRequirement = 100) {
  let rating = current + gain;
  let level = prestige;
  let requirement = prestigeRequirement(level, baseRequirement);
  while (rating >= requirement) {
    rating -= requirement;
    level += 1;
    requirement = prestigeRequirement(level, baseRequirement);
  }
  return { rating, prestige: level, requirement };
}

// User-authored growth-stage ladder for the prestige count itself (index 0
// is where every value starts, not a bonus you unlock) -- shared naming,
// meant to be reused for the avatar level-up's own prestige later, same as
// the math above already is. No icon here -- plain data only, same
// convention as the rest of this file; whichever component renders a stage
// picks its own icon by `index`.
export const PRESTIGE_LEVELS = [
  { name: "Seed", desc: "I have planted the intention." },
  { name: "Sprout", desc: "I am beginning to act." },
  { name: "Rooted", desc: "I am building foundations." },
  { name: "Bloom", desc: "My growth is becoming visible." },
  { name: "Flourish", desc: "I am creating sustained momentum." },
  { name: "Cultivator", desc: "I consciously tend and develop this part of my life." },
  { name: "Embodied", desc: "This has become part of who I am." },
  { name: "Luminary", desc: "My experience has become a source of wisdom and inspiration." }
];

function toRoman(num) {
  const romans = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let result = "";
  for (const [value, symbol] of romans) {
    while (num >= value) { result += symbol; num -= value; }
  }
  return result;
}

// Once past the 8 authored stages, keeps "Luminary" but counts further
// prestiges with a Roman numeral rather than inventing new words forever.
// `index` is clamped to the last authored stage so a caller can still pick
// a matching icon for any prestige count, including these overflow ones.
export function getPrestigeStage(prestige) {
  const index = Math.min(prestige, PRESTIGE_LEVELS.length - 1);
  const base = PRESTIGE_LEVELS[index];
  if (prestige < PRESTIGE_LEVELS.length) return { ...base, index };
  const extra = prestige - PRESTIGE_LEVELS.length + 2; // "Luminary II" the first time past the list
  return { ...base, name: `${base.name} ${toRoman(extra)}`, index };
}
