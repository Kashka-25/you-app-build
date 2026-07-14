// pursue.js - items: form, add, complete, un-achieve, edit, delete, cards
// Part of the YOU app. Loaded via index.html in dependency order.

// ── TAGS / MILESTONES (add form) ──
function addTag(e){if(e&&e.key!=="Enter")return;var v=document.getElementById("tagInput").value.trim().replace(/^#/,"").replace(/\s+/g,"-");if(!v||pendingTags.indexOf(v)>=0)return;pendingTags.push(v);document.getElementById("tagInput").value="";renderTagChips();}
function removeTag(t){pendingTags=pendingTags.filter(function(x){return x!==t;});renderTagChips();}
function renderTagChips(){document.getElementById("tagChips").innerHTML=pendingTags.map(function(t){return "<span class=\"tag-chip\">#"+t+" <span class=\"rm\" onclick=\"removeTag('"+t+"')\">&times;</span></span>";}).join("");}
function toggleMilestones(){msToggleOpen=!msToggleOpen;document.getElementById("msInput").classList.toggle("show",msToggleOpen);document.getElementById("msToggle").textContent=msToggleOpen?"- Milestones":"+ Milestones";}
function addMilestone(e){if(e&&e.key!=="Enter")return;var v=document.getElementById("msText").value.trim();if(!v)return;pendingMilestones.push({text:v,done:false});document.getElementById("msText").value="";renderMsEdit();}
function removeMsEdit(i){pendingMilestones.splice(i,1);renderMsEdit();}
function renderMsEdit(){document.getElementById("msListEdit").innerHTML=pendingMilestones.map(function(m,i){return "<div class=\"ms-item-edit\"><span style=\"color:var(--mist);font-size:11px\">"+(i+1)+".</span><span style=\"flex:1;font-size:12px;color:var(--cream)\">"+m.text+"</span><button onclick=\"removeMsEdit("+i+")\">&times;</button></div>";}).join("");}
function onTypeChange(){var t=document.getElementById("newType").value;document.getElementById("msToggle").style.display=t==="habit"?"none":"block";if(t==="habit"){pendingMilestones=[];renderMsEdit();}}

// ── ADD ITEM ──
function openIntentionModal(){var name=document.getElementById("newName").value.trim();if(!name){document.getElementById("newName").focus();return;}var type=document.getElementById("newType").value;var cat=document.getElementById("newCat").value;var note=document.getElementById("newNote").value.trim();pendingItem={id:"temp_"+Date.now(),name:name,type:type,cat:cat,note:note,tags:pendingTags.slice(),milestones:pendingMilestones.map(function(m){return {text:m.text,done:false};}),done:false,streak:0,days:[false,false,false,false,false,false,false],lastCheckin:null,intention:"",created:new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}),createdDate:new Date().toISOString().split("T")[0]};var qs={habit:["What will this practice awaken in you?","Small rituals shape entire lives. What shift will this create?"],goal:["What will this unlock in you?","When you achieve this, who will you have become?"],dream:["What does this dream mean to your soul?","Close your eyes. Why does this dream keep calling you?"]};var q=qs[type];document.getElementById("intentionQ").textContent=q[0];document.getElementById("intentionSub").textContent=q[1];document.getElementById("intentionText").value="";document.getElementById("intentionModal").classList.add("open");setTimeout(function(){document.getElementById("intentionText").focus();},100);}
async function confirmAdd(skip){if(!pendingItem)return;if(!skip)pendingItem.intention=document.getElementById("intentionText").value.trim();document.getElementById("intentionModal").classList.remove("open");S.items.push(pendingItem);render();await saveItem(pendingItem);pendingItem=null;pendingMilestones=[];pendingTags=[];document.getElementById("newName").value="";document.getElementById("newNote").value="";document.getElementById("intentionText").value="";document.getElementById("tagChips").innerHTML="";document.getElementById("msListEdit").innerHTML="";if(msToggleOpen)toggleMilestones();showToast("+ Planted in your YOUniverse");setSync("synced");}

// ── COMPLETE ──
function openCompleteModal(id){var item=findItem(id);if(!item||item.done)return;pendingCompleteId=id;var prompts={habit:"What has this practice given you?",goal:"You achieved this. Who have you become in the process?",dream:"This dream is now real. What does that feel like?"};var subs={habit:"Take a moment to honour the consistency it took.",goal:"Reflect before you move on. This matters.",dream:"Let it land. You made something real from imagination."};document.getElementById("completeQ").textContent=prompts[item.type]||prompts.goal;document.getElementById("completeSub").textContent=subs[item.type]||subs.goal;document.getElementById("completeText").value="";document.getElementById("completeModal").classList.add("open");setTimeout(function(){document.getElementById("completeText").focus();},100);}
async function confirmComplete(skip){document.getElementById("completeModal").classList.remove("open");if(!pendingCompleteId)return;var id=pendingCompleteId;pendingCompleteId=null;var item=findItem(id);if(!item||item.done)return;var reflection=skip?"":document.getElementById("completeText").value.trim();if(reflection)item.note=(item.note?item.note+" | ":"")+reflection;var xp=XP_VALS[item.type]||10;var oldXP=S.totalXP;item.done=true;S.totalXP+=xp;var dateKey=getTodayKey();var entry={name:item.name,type:item.type,xp:xp,date:new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}),dateKey:dateKey,cat:item.cat,tags:item.tags||[],itemId:item.id};S.memory.unshift(entry);checkLevelUp(oldXP,S.totalXP);render();var msgs=["+ "+xp+" XP - it is done.","+ Woven into your memory. +"+xp+" XP","+ Another star in your YOUniverse. +"+xp+" XP","+ You showed up. +"+xp+" XP"];showToast(msgs[Math.floor(Math.random()*msgs.length)]);await Promise.all([saveItem(item),saveMemoryEntry(entry)]);setSync("synced");}

// ── UN-ACHIEVE (full undo) ──
async function unachieveItem(id){
  var item=findItem(id);if(!item||!item.done)return;
  // Find the memory entry for this completion
  var memIdx=-1;
  for(var i=0;i<S.memory.length;i++){
    if(S.memory[i].itemId===id || (S.memory[i].name===item.name && S.memory[i].xp===(XP_VALS[item.type]||10))){memIdx=i;break;}
  }
  var xpToRemove=XP_VALS[item.type]||10;
  item.done=false;
  S.totalXP=Math.max(0,S.totalXP-xpToRemove);
  // Remove memory entry locally + from DB
  if(memIdx>=0){
    var memEntry=S.memory[memIdx];
    S.memory.splice(memIdx,1);
    if(memEntry.id){await db.from("memory").delete().eq("id",memEntry.id).eq("user_id",USER_ID);}
    else if(memEntry.dateKey){await db.from("memory").delete().eq("user_id",USER_ID).eq("name",memEntry.name).eq("date_key",memEntry.dateKey);}
  }
  render();
  await saveItem(item);
  showToast("Returned to your pursuit. XP released.");
  setSync("synced");
}

async function deleteItem(id){if(!confirm("Delete this permanently? This cannot be undone."))return;S.items=S.items.filter(function(i){return i.id!=id;});render();await db.from("items").delete().eq("id",id).eq("user_id",USER_ID);setSync("synced");}

// ── EDIT ──
function openEdit(id){var item=findItem(id);if(!item)return;editingId=id;document.getElementById("editName").value=item.name;document.getElementById("editType").value=item.type;document.getElementById("editCat").value=item.cat;editTags=(item.tags||[]).slice();editMilestones=(item.milestones||[]).map(function(m){return {text:m.text,done:m.done};});document.getElementById("editNote").value=item.note||"";renderEditTags();renderEditMs();document.getElementById("editModal").classList.add("open");}
function addEditTag(e){if(e&&e.key!=="Enter")return;var v=document.getElementById("editTagInput").value.trim().replace(/^#/,"").replace(/\s+/g,"-");if(!v||editTags.indexOf(v)>=0)return;editTags.push(v);document.getElementById("editTagInput").value="";renderEditTags();}
function removeEditTag(t){editTags=editTags.filter(function(x){return x!==t;});renderEditTags();}
function renderEditTags(){document.getElementById("editTagChips").innerHTML=editTags.map(function(t){return "<span class=\"tag-chip\">#"+t+" <span class=\"rm\" onclick=\"removeEditTag('"+t+"')\">&times;</span></span>";}).join("");}
function addEditMilestone(e){if(e&&e.key!=="Enter")return;var v=document.getElementById("editMsText").value.trim();if(!v)return;editMilestones.push({text:v,done:false});document.getElementById("editMsText").value="";renderEditMs();}
function removeEditMs(i){editMilestones.splice(i,1);renderEditMs();}
function renderEditMs(){document.getElementById("editMsList").innerHTML=editMilestones.map(function(m,i){return "<div class=\"ms-item-edit\"><span style=\"color:var(--mist);font-size:11px\">"+(i+1)+".</span><span style=\"flex:1;font-size:12px;color:"+(m.done?"var(--mist)":"var(--cream)")+";"+(m.done?"text-decoration:line-through":"")+"\">"+m.text+"</span><button onclick=\"removeEditMs("+i+")\">&times;</button></div>";}).join("");}
async function saveEdit(){var item=findItem(editingId);if(!item){closeEdit();return;}item.name=document.getElementById("editName").value.trim()||item.name;item.type=document.getElementById("editType").value;item.cat=document.getElementById("editCat").value;item.tags=editTags.slice();item.note=document.getElementById("editNote").value.trim();item.milestones=editMilestones.map(function(m){return {text:m.text,done:m.done};});closeEdit();render();await saveItem(item);showToast("Your universe updated.");setSync("synced");}
function closeEdit(){editingId=null;document.getElementById("editModal").classList.remove("open");}

// ── DAY TOGGLE ──
async function toggleDay(id,di){var item=findItem(id);if(!item)return;var today=getTodayKey();if(item.days[di]){item.days[di]=false;item.streak=Math.max(0,item.streak-1);S.totalXP=Math.max(0,S.totalXP-3);render();await saveItem(item);setSync("synced");return;}else{item.days[di]=true;if(!checkStreakIntact(item)){item.streak=1;}else if(item.lastCheckin!==today){item.streak=(item.streak||0)+1;}item.lastCheckin=today;var baseXp=3;var bonus=getStreakBonus(item.streak);var totalXp=baseXp+bonus;var oldXP=S.totalXP;S.totalXP+=totalXp;showToast(bonus>0?"+ Day logged. +"+totalXp+" XP (7-day bonus!)":"+ Day logged. +"+totalXp+" XP");var entry={name:item.name+" (check-in)",type:"habit",xp:totalXp,date:new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"}),dateKey:today,cat:item.cat,tags:item.tags||[]};S.memory.unshift(entry);checkLevelUp(oldXP,S.totalXP);await Promise.all([saveItem(item),saveMemoryEntry(entry)]);}render();setSync("synced");}
async function toggleMilestone(itemId,mi){var item=findItem(itemId);if(!item)return;var ms=item.milestones[mi];ms.done=!ms.done;if(ms.done){S.totalXP+=5;showToast("+ Milestone unlocked. +5 XP");}else{S.totalXP=Math.max(0,S.totalXP-5);showToast("Milestone reopened. -5 XP");}render();await saveItem(item);setSync("synced");}

function findItem(id){for(var i=0;i<S.items.length;i++){if(S.items[i].id==id)return S.items[i];}return null;}
function setFilter(f,el){activeFilter=f;var chips=document.querySelectorAll(".filter-chip");for(var i=0;i<chips.length;i++)chips[i].classList.remove("active");el.classList.add("active");renderItems();}
function toggleCard(id){var d=document.getElementById("detail-"+id);if(d)d.classList.toggle("open");}

// ── CARD RENDER ──
function cardHtml(item,showActions){
  var msTotal=(item.milestones||[]).length;var msDone=(item.milestones||[]).filter(function(m){return m.done;}).length;var msPct=msTotal>0?Math.round(msDone/msTotal*100):0;
  var tags=(item.tags||[]).map(function(t){return "<span class=\"user-tag\">#"+t+"</span>";}).join("");
  var streakHtml="";
  if(item.type==="habit"){var consistency=getConsistency(item);streakHtml="<span class=\"streak\">&#128293; "+item.streak+"d</span>"+(item.streak>0&&item.streak%STREAK_BONUS_INTERVAL===0?"<span class=\"streak-bonus\">7-day bonus!</span>":"")+"<span class=\"consistency\">"+consistency+"% this week</span>";}
  var note=item.note?"<div class=\"note-preview\">"+item.note+"</div>":"";
  var days="";
  if(item.type==="habit"&&!item.done){days="<div class=\"habit-days\">"+DAY_LABELS.map(function(d,i){var isBonus=item.days[i]&&item.streak>0&&item.streak%STREAK_BONUS_INTERVAL===0;return "<div class=\"day-col\"><div class=\"day-dot"+(item.days[i]?(isBonus?" bonus":" lit"):"")+"\" onclick=\"toggleDay('"+item.id+"',"+i+")\" title=\""+d+"\"></div><div class=\"day-lbl\">"+d+"</div></div>";}).join("")+"</div>";}
  var msBar=msTotal>0?"<div class=\"milestones-wrap\"><div class=\"ms-bar-bg\"><div class=\"ms-bar-fill\" style=\"width:"+msPct+"%\"></div></div><div style=\"font-size:10px;color:var(--mist);margin-bottom:4px\">"+msDone+"/"+msTotal+" milestones</div></div>":"";
  var checkBtn=showActions?"<button class=\"check-btn\" onclick=\"openCompleteModal('"+item.id+"')\">"+(item.done?"&#10003;":"")+"</button>":"<button class=\"check-btn\" style=\"cursor:default;background:var(--sage);border-color:var(--sage);color:var(--cream)\">&#10003;</button>";
  // Action buttons: edit always, undo if done, delete always
  var actions="";
  if(showActions){
    actions="<div class=\"card-actions\">";
    actions+="<button class=\"icon-btn edit\" onclick=\"openEdit('"+item.id+"')\" title=\"Edit\">&#9998;</button>";
    if(item.done)actions+="<button class=\"icon-btn undo\" onclick=\"unachieveItem('"+item.id+"')\" title=\"Move back to active\">&#8634;</button>";
    actions+="<button class=\"icon-btn del\" onclick=\"deleteItem('"+item.id+"')\" title=\"Delete\">&times;</button>";
    actions+="</div>";
  }
  var expand="";
  if(item.intention||item.note||msTotal>0){var msList=msTotal>0?"<div class=\"ms-list\">"+item.milestones.map(function(m,mi){return "<div class=\"ms-item\"><button class=\"ms-check"+(m.done?" done":"")+"\" onclick=\"toggleMilestone('"+item.id+"',"+mi+")\">"+(m.done?"&#10003;":"")+"</button><span class=\"ms-label"+(m.done?" done":"")+"\">"+m.text+"</span></div>";}).join("")+"</div>":"";expand="<button class=\"expand-btn\" onclick=\"toggleCard('"+item.id+"')\">expand</button><div class=\"card-detail\" id=\"detail-"+item.id+"\">"+(item.intention?"<div class=\"detail-intention\">"+item.intention+"</div>":"")+(item.note?"<div class=\"detail-note\">"+item.note+"</div>":"")+msList+"</div>";}
  return "<div class=\"item-card"+(item.done?" done":"")+"\" data-type=\""+item.type+"\"><div class=\"card-top\">"+checkBtn+"<div class=\"card-body\"><div class=\"item-name\">"+item.name+"</div><div class=\"item-meta\"><span class=\"type-tag "+item.type+"\">"+item.type+"</span><span class=\"cat-badge cat-"+item.cat+"\">"+item.cat+"</span>"+tags+streakHtml+"</div>"+note+days+msBar+"</div>"+actions+"</div>"+expand+"</div>";
}
function renderItems(){var q=(document.getElementById("searchInput")?document.getElementById("searchInput").value:"").toLowerCase();var items=S.items.filter(function(i){if(activeFilter==="done")return i.done;if(activeFilter!=="all"&&i.type!==activeFilter)return false;if(q&&i.name.toLowerCase().indexOf(q)<0&&!(i.tags||[]).some(function(t){return t.indexOf(q)>=0;}))return false;return true;});var all=items.filter(function(i){return !i.done;}).concat(items.filter(function(i){return i.done;}));var el=document.getElementById("itemsList");if(all.length===0){el.innerHTML="<div class=\"empty-state\">Your YOUniverse awaits your intentions...</div>";return;}el.innerHTML="<div class=\"items-grid\">"+all.map(function(item){return cardHtml(item,true);}).join("")+"</div>";}
