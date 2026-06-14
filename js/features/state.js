// state.js - global state, profile, stats, toast
// Part of the YOU app. Loaded via index.html in dependency order.

// ── STATE ──
var S = {items:[],memory:[],moodLog:[],totalXP:0,values:[]};
var pendingItem=null, pendingMilestones=[], pendingTags=[], pendingCompleteId=null;
var activeFilter="all", selectedMood="", msToggleOpen=false;
var calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
var activeValueIdx=0, valueDiffFilter="all";
var editingId=null, editTags=[], editMilestones=[];

var userProfile=null;
function profileKey(){return "you_profile_"+(USER_ID||"anon");}
function valuesKey(){return "you_values_"+(USER_ID||"anon");}
function saveProfile(p){userProfile=p;localStorage.setItem(profileKey(),JSON.stringify(p));}
function loadProfile(){userProfile=JSON.parse(localStorage.getItem(profileKey())||"null");}
function saveValues(){localStorage.setItem(valuesKey(),JSON.stringify(S.values));}
function loadValues(){var s=localStorage.getItem(valuesKey());if(s)S.values=JSON.parse(s);}

function initApp(){
  loadProfile();
  if(!userProfile){
    document.getElementById("onboarding").style.display="flex";
    document.getElementById("app").style.display="none";
    renderObValuesGrid();
  } else {
    document.getElementById("onboarding").style.display="none";
    document.getElementById("app").style.display="block";
    loadValues();
    setGreeting();
    loadFromDB();
  }
}

function getLevel(xp){var l={level:1,name:LEVELS[0].name};for(var i=0;i<LEVELS.length;i++){if(xp>=LEVELS[i].xp)l={level:i+1,name:LEVELS[i].name};}return l;}
function getXPPct(xp){for(var i=0;i<LEVELS.length-1;i++){if(xp>=LEVELS[i].xp&&xp<LEVELS[i+1].xp)return Math.round((xp-LEVELS[i].xp)/(LEVELS[i+1].xp-LEVELS[i].xp)*100);}return xp>=LEVELS[LEVELS.length-1].xp?100:0;}
function updateStats(){var active=S.items.filter(function(i){return !i.done;}).length;var done=S.memory.filter(function(m){return m.xp>=XP_VALS.habit;}).length;var bestStreak=S.items.reduce(function(m,i){return Math.max(m,i.streak||0);},0);var msComplete=S.items.reduce(function(m,i){return m+(i.milestones||[]).filter(function(ms){return ms.done;}).length;},0);document.getElementById("sActive").textContent=active;document.getElementById("sDone").textContent=done;document.getElementById("sStreak").textContent=bestStreak;document.getElementById("sMilestones").textContent=msComplete;document.getElementById("sXP").textContent=S.totalXP;var lv=getLevel(S.totalXP);document.getElementById("xpLevel").textContent=lv.name+" - Lv "+lv.level;document.getElementById("xpFill").style.width=getXPPct(S.totalXP)+"%";renderAvatar();}
function showToast(msg){var t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2800);}
