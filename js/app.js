// app.js - tab routing, render orchestration, init
// Part of the YOU app. Loaded via index.html in dependency order.

function switchTab(tab){var tabs=document.querySelectorAll(".tab");var names=["pursue","memory","calendar","tags","pillars","values"];for(var i=0;i<tabs.length;i++)tabs[i].classList.toggle("active",names[i]===tab);for(var j=0;j<names.length;j++){document.getElementById("panel-"+names[j]).classList.toggle("active",names[j]===tab);}if(tab==="calendar")renderCalendar();if(tab==="tags")renderTags();if(tab==="pillars")renderPillars();if(tab==="values")renderValues();}
function render(){updateStats();renderItems();renderMemory();}

document.addEventListener("DOMContentLoaded",function(){var ni=document.getElementById("newName");if(ni)ni.addEventListener("keydown",function(e){if(e.key==="Enter")openIntentionModal();});var im=document.getElementById("intentionModal");if(im)im.addEventListener("click",function(e){if(e.target===im)confirmAdd(true);});var cm=document.getElementById("completeModal");if(cm)cm.addEventListener("click",function(e){if(e.target===cm)confirmComplete(true);});var bm=document.getElementById("breakthroughModal");if(bm)bm.addEventListener("click",function(e){if(e.target===bm)closeBreakthrough();});var em=document.getElementById("editModal");if(em)em.addEventListener("click",function(e){if(e.target===em)closeEdit();});checkAuth();});
