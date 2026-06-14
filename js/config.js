// config.js - Supabase client + app constants
// Part of the YOU app. Loaded via index.html in dependency order.

var SUPABASE_URL = "https://yikoymzktspamahrsuje.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpa295bXprdHNwYW1haHJzdWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Njc4OTIsImV4cCI6MjA5NjE0Mzg5Mn0.tCjIeCz7PtJ5DeLHsKk974qB7KbaflQ_XAAJk7z7tfw";
var db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONSTANTS ──
var LEVELS = [
  {xp:0,name:"Seedling",desc:"You have just arrived. A quiet glow. The universe has noticed you.",avatar:"SEED"},
  {xp:100,name:"Ember",desc:"Something is stirring. Roots have taken hold. Your inner fire awakens.",avatar:"EMBER"},
  {xp:250,name:"Wanderer",desc:"You have found your feet. Curious and unbound, moving with open eyes.",avatar:"WANDER"},
  {xp:500,name:"Seeker",desc:"You stand upright. A small flame burns in your chest, visible now.",avatar:"SEEKER"},
  {xp:900,name:"Alchemist",desc:"You are transforming everything you touch. The work is sacred now.",avatar:"ALCH"},
  {xp:1500,name:"Sage",desc:"You have become rooted like an ancient tree. Others feel safe near you.",avatar:"SAGE"},
  {xp:2500,name:"Oracle",desc:"Barely corporeal. More light than form. You see across time.",avatar:"ORACLE"},
  {xp:4000,name:"Elder",desc:"The cycle is complete. You are the light that plants new universes.",avatar:"ELDER"}
];
var XP_VALS = {habit:10, goal:25, dream:50};
var STREAK_BONUS_XP = 15;
var STREAK_BONUS_INTERVAL = 7;
var DAY_LABELS = ["M","T","W","T","F","S","S"];
var MOOD_LABELS = {NM:"Dark - rest is sacred",WC:"Low - gentle with yourself",FQ:"Neutral - steady ground",WG:"Rising - momentum building",FM:"Full - you are on fire"};
var MOOD_EMOJI = {NM:"\ud83c\udf11",WC:"\ud83c\udf12",FQ:"\ud83c\udf13",WG:"\ud83c\udf14",FM:"\ud83c\udf15"};
var PILLAR_COLORS = {Body:"#c4783a",Mind:"#7a8c5e",Spirit:"#d4a85a",Relationships:"#9a8870",Work:"#6478a0",Adventure:"#a06448",Creative:"#a06490"};
var SEASONAL_EVENTS = [
  {month:3,day:20,name:"Spring Equinox",desc:"Balance of light and dark. Plant what you wish to grow through the year.",type:"equinox"},
  {month:6,day:21,name:"Summer Solstice",desc:"Peak light. Celebrate what has bloomed. Share your gifts fully.",type:"solstice"},
  {month:9,day:22,name:"Autumn Equinox",desc:"Harvest and release. What have you built? What must now be let go?",type:"equinox"},
  {month:12,day:21,name:"Winter Solstice",desc:"The longest night. Rest, reflect, and prepare for the return of the light.",type:"solstice"}
];
var VALUE_PILLAR = {Communication:"Relationships",Courage:"Spirit",Presence:"Mind",Boundaries:"Relationships",Discipline:"Body",Empathy:"Relationships",Curiosity:"Mind",Rest:"Body",Integrity:"Work",Creativity:"Creative",Vulnerability:"Spirit",Gratitude:"Spirit"};
var VALUE_PILLAR2 = {Discipline:"Work",Empathy:"Spirit",Curiosity:"Adventure"};
var TIERS = [{min:0,max:25,name:"Awakening",color:"#9a8870"},{min:26,max:50,name:"Practising",color:"#c4783a"},{min:51,max:75,name:"Embodying",color:"#d4a85a"},{min:76,max:99,name:"Mastering",color:"#7a8c5e"}];
