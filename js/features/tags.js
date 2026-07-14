// tags.js - Tags tab grouping + filtering
// Part of the YOU app. Loaded via index.html in dependency order.

function setTagFilter(tag){tagFilter=tag;renderTags();}
function setTagStatusFilter(status){tagStatusFilter=status;renderTags();}

function renderTags(){
  var el=document.getElementById("tagsList");
  if(!el)return;
  var allTags={};
  S.items.forEach(function(item){
    (item.tags||[]).forEach(function(tag){
      if(!allTags[tag])allTags[tag]={active:[],achieved:[]};
      if(item.done)allTags[tag].achieved.push(item);
      else allTags[tag].active.push(item);
    });
  });
  var tagNames=Object.keys(allTags).sort();

  var sel=document.getElementById("tagFilterSelect");
  if(sel){
    if(tagNames.indexOf(tagFilter)<0 && tagFilter!=="all")tagFilter="all";
    sel.innerHTML="<option value=\"all\">All tags</option>"+tagNames.map(function(t){return "<option value=\""+t+"\""+(tagFilter===t?" selected":"")+">#"+t+"</option>";}).join("");
  }

  document.querySelectorAll(".tag-status-chip").forEach(function(c){c.classList.toggle("active",c.getAttribute("data-status")===tagStatusFilter);});

  if(tagNames.length===0){el.innerHTML="<div class=\"tags-empty\">Add tags to your items to see them organised here...</div>";return;}

  var visibleTags=tagFilter==="all"?tagNames:tagNames.filter(function(t){return t===tagFilter;});
  var showActive=tagStatusFilter==="all"||tagStatusFilter==="active";
  var showAchieved=tagStatusFilter==="all"||tagStatusFilter==="achieved";

  var html=visibleTags.map(function(tag){
    var data=allTags[tag];
    var activeList=showActive?data.active:[];
    var achievedList=showAchieved?data.achieved:[];
    if(activeList.length===0&&achievedList.length===0)return "";
    var total=activeList.length+achievedList.length;
    var activeHtml=activeList.map(function(i){return cardHtml(i,true);}).join("");
    var achievedHtml=achievedList.map(function(i){return cardHtml(i,true);}).join("");
    return "<div class=\"tags-section\"><div class=\"tags-section-header\"><span class=\"tags-section-name\">#"+tag+"</span><span class=\"tags-section-count\">"+total+" items</span></div>"
      +(activeList.length>0?"<div class=\"tags-section-divider\">In progress</div><div class=\"items-grid\">"+activeHtml+"</div>":"")
      +(achievedList.length>0?"<div class=\"tags-section-divider\">Achieved</div><div class=\"items-grid\">"+achievedHtml+"</div>":"")
      +"</div>";
  }).join("");

  if(!html.trim()){el.innerHTML="<div class=\"tags-empty\">No items match this filter.</div>";return;}
  el.innerHTML=html;
}
