// streak.util.js - streak + date key helpers
// Part of the YOU app. Loaded via index.html in dependency order.

// ── STREAK HELPERS ──
function getTodayKey(){return new Date().toISOString().split("T")[0];}
function getYesterdayKey(){var d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];}
function checkStreakIntact(item){if(!item.lastCheckin)return false;return item.lastCheckin===getTodayKey()||item.lastCheckin===getYesterdayKey();}
function getStreakBonus(streak){if(streak>0&&streak%STREAK_BONUS_INTERVAL===0)return STREAK_BONUS_XP;return 0;}
function getConsistency(item){var lit=(item.days||[]).filter(Boolean).length;return Math.round((lit/7)*100);}
