// db.service.js - Supabase load/save for items, memory, mood
// Part of the YOU app. Loaded via index.html in dependency order.

// ── SUPABASE DATA ──
async function loadFromDB(){
  setSync("loading");
  try{
    var r=await Promise.all([
      db.from("items").select("*").eq("user_id",USER_ID).order("inserted_at"),
      db.from("memory").select("*").eq("user_id",USER_ID).order("inserted_at",{ascending:false}),
      db.from("mood_log").select("*").eq("user_id",USER_ID).order("inserted_at",{ascending:false}).limit(90)
    ]);
    S.items=(r[0].data||[]).map(dbToItem);
    S.memory=r[1].data||[];
    S.moodLog=r[2].data||[];
    S.totalXP=S.memory.reduce(function(s,m){return s+(m.xp||0);},0);
    setSync("synced");
  }catch(e){console.log(e);setSync("offline");}
  render();
}
function dbToItem(row){return {id:row.id,name:row.name,type:row.type,cat:row.cat,note:row.note||"",tags:row.tags||[],intention:row.intention||"",milestones:row.milestones||[],done:row.done,streak:row.streak||0,days:row.days||[false,false,false,false,false,false,false],lastCheckin:row.last_checkin||null,created:row.created,createdDate:row.created_date};}
async function saveItem(item){var row={user_id:USER_ID,name:item.name,type:item.type,cat:item.cat,note:item.note||"",tags:item.tags||[],intention:item.intention||"",milestones:item.milestones||[],done:item.done,streak:item.streak||0,days:item.days||[false,false,false,false,false,false,false],last_checkin:item.lastCheckin||null,created:item.created,created_date:item.createdDate};if(item.id&&item.id.toString().indexOf("temp_")!==0)row.id=item.id;var res=await db.from("items").upsert(row).select().single();if(res.data)item.id=res.data.id;}
async function saveMemoryEntry(entry){var res=await db.from("memory").insert({user_id:USER_ID,name:entry.name,type:entry.type,xp:entry.xp,date:entry.date,date_key:entry.dateKey,cat:entry.cat||null,tags:entry.tags||null}).select().single();if(res.data)entry.id=res.data.id;}
async function saveMood(entry){await db.from("mood_log").insert({user_id:USER_ID,mood:entry.mood,energy:entry.energy,date:entry.date,date_key:entry.dateKey});}
function setSync(msg){var el=document.getElementById("syncStatus");if(el)el.textContent=msg;}
