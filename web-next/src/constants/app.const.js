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
  Integrity:"Work", Creativity:"Creative", Vulnerability:"Spirit", Gratitude:"Spirit"
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
  Communication: "hsl(330, 35%, 55%)"
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

// Pillars level up every PILLAR_LEVEL_XP, same "fill gradually, reset on
// level-up" pattern as Values' tiers -- xp % PILLAR_LEVEL_XP is the bar's
// current fill, which naturally lands back at 0 the instant a level is
// crossed, no separate reset step needed.
export const PILLAR_LEVEL_XP = 100;

export function getPillarLevel(xp){
  const level = Math.floor(xp / PILLAR_LEVEL_XP);
  const progress = xp % PILLAR_LEVEL_XP;
  const pct = Math.round((progress / PILLAR_LEVEL_XP) * 100);
  return { level, progress, pct };
}
