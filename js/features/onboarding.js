// onboarding.js - onboarding flow + value picker
// Part of the YOU app. Loaded via index.html in dependency order.

// ── ONBOARDING ──
var obSelectedValues=[];
function renderObValuesGrid(){
  var grid=document.getElementById("obValuesGrid");if(!grid)return;
  grid.innerHTML=ALL_VALUES_LIB.map(function(v){return "<div class=\"ob-value-btn\" onclick=\"toggleObValue('"+v.name+"',this)\"><span class=\"ob-v-icon\">"+v.icon+"</span>"+v.name+"</div>";}).join("");
}
function toggleObValue(name,el){var i=obSelectedValues.indexOf(name);if(i>=0){obSelectedValues.splice(i,1);el.classList.remove("selected");}else{obSelectedValues.push(name);el.classList.add("selected");}}

var obData={};
function skipTime(){obData.birthTime="12:00";document.getElementById("ob-step3").classList.remove("active");document.getElementById("ob-step4").classList.add("active");}
async function obNext(step){
  if(step===1){var n=document.getElementById("obName").value.trim();if(!n){document.getElementById("obName").focus();return;}obData.name=n;document.getElementById("ob-step1").classList.remove("active");document.getElementById("ob-step2").classList.add("active");}
  else if(step===2){var b=document.getElementById("obBirthday").value;if(!b){document.getElementById("obBirthday").focus();return;}obData.birthday=b;document.getElementById("ob-step2").classList.remove("active");document.getElementById("ob-step3").classList.add("active");}
  else if(step===3){var t=document.getElementById("obBirthTime").value;obData.birthTime=t||"12:00";document.getElementById("ob-step3").classList.remove("active");document.getElementById("ob-step4").classList.add("active");}
  else if(step===4){var p=document.getElementById("obBirthplace").value.trim();if(!p){document.getElementById("obBirthplace").focus();return;}obData.birthplace=p;document.getElementById("ob-step4").classList.remove("active");document.getElementById("ob-step5").classList.add("active");renderObValuesGrid();}
  else if(step===5){
    if(obSelectedValues.length===0){showToast("Pick at least one value to begin");return;}
    var profile={name:obData.name,birthday:obData.birthday,birthTime:obData.birthTime,birthplace:obData.birthplace,sunSign:getSunSign(obData.birthday),moonSign:getMoonSign(obData.birthday),risingSign:getRisingSign(obData.birthday,obData.birthTime)};
    S.values=obSelectedValues.map(function(name){return {name:name,rating:0,completed:[]};});
    await saveProfile(profile);
    await saveValues();
    document.getElementById("onboarding").style.display="none";
    document.getElementById("app").style.display="block";
    setGreeting();loadFromDB();
    showToast("Welcome to your YOUniverse, "+profile.name);
  }
}
function setGreeting(){if(!userProfile)return;var h=new Date().getHours();var t=h<12?"Good morning":h<17?"Good afternoon":"Good evening";var el=document.getElementById("userGreeting");if(el)el.textContent=t+", "+userProfile.name;}
