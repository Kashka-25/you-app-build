// memory.js - Memory Bank render
// Part of the YOU app. Loaded via index.html in dependency order.

function renderMemory(){var el=document.getElementById("memoryList");var mem=S.memory.filter(function(m){return m.xp>=XP_VALS.habit;});if(mem.length===0){el.innerHTML="<div class=\"empty-state\">Your achievements will live here...</div>";return;}el.innerHTML="<div class=\"memory-bank\">"+mem.map(function(m){return "<div class=\"memory-item\"><span class=\"memory-star\">+</span><div class=\"memory-name\">"+m.name+"</div><span class=\"type-tag "+m.type+"\">"+m.type+"</span><span class=\"memory-xp\">+"+m.xp+" xp</span><span class=\"memory-date\">"+m.date+"</span></div>";}).join("")+"</div>";}
