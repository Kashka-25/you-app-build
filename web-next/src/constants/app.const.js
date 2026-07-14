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
