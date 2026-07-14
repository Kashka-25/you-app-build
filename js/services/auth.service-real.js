// auth.service.js - magic link + email/password authentication
// Part of the YOU app. Loaded via index.html in dependency order.

// ⚠️  Set to "live" for production. "bypass" skips auth (dev only). "onboarding" shows onboarding flow.
var DEV_MODE = "live";

// ── AUTH STATE ──
var currentUser = null;
var USER_ID = null;

async function checkAuth() {
  if (DEV_MODE === "bypass") {
    currentUser = { id: "dev-local-user", email: "dev@local" };
    USER_ID = "dev-local-user";
    userProfile = {
      name: "Cassidy",
      birthday: "1990-01-01",
      birthTime: "12:00",
      birthplace: "Sydney, Australia",
      sunSign: "Capricorn",
      moonSign: "Taurus",
      risingSign: "Virgo"
    };
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("onboarding").style.display = "none";
    document.getElementById("app").style.display = "block";
    setGreeting();
    loadFromDB();
    return;
  }
  if (DEV_MODE === "onboarding") {
    currentUser = { id: "dev-local-user", email: "dev@local" };
    USER_ID = "dev-local-user";
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("onboarding").style.display = "flex";
    document.getElementById("app").style.display = "none";
    return;
  }

  // "live" — normal auth
  var result = await db.auth.getSession();
  var session = result.data.session;
  if (session && session.user) {
    currentUser = session.user;
    USER_ID = currentUser.id;
    showApp();
  } else {
    showLogin();
  }
  db.auth.onAuthStateChange(function(event, session) {
    if (session && session.user) {
      currentUser = session.user;
      USER_ID = currentUser.id;
      showApp();
    } else if (event === "SIGNED_OUT") {
      currentUser = null; USER_ID = null;
      showLogin();
    }
  });
}

// ── AUTH TAB SWITCH ──
function switchAuthTab(tab) {
  document.getElementById("authPanelPassword").style.display = tab === "password" ? "block" : "none";
  document.getElementById("authPanelMagic").style.display = tab === "magic" ? "block" : "none";
  document.getElementById("tabPassword").classList.toggle("active", tab === "password");
  document.getElementById("tabMagic").classList.toggle("active", tab === "magic");
  clearAuthErrors();
}

function clearAuthErrors() {
  var els = ["authErrorPw", "authError"];
  els.forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = ""; });
}

// ── EMAIL + PASSWORD ──
async function signInWithPassword() {
  var email = document.getElementById("authEmailPw").value.trim();
  var password = document.getElementById("authPassword").value;
  var errEl = document.getElementById("authErrorPw");
  if (!email || email.indexOf("@") < 0) { errEl.textContent = "Please enter a valid email."; return; }
  if (!password) { errEl.textContent = "Please enter your password."; return; }
  errEl.textContent = "";
  var btn = document.getElementById("authBtnLogin");
  btn.disabled = true; btn.textContent = "Entering...";
  var result = await db.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    errEl.textContent = result.error.message === "Invalid login credentials"
      ? "Email or password not recognised."
      : result.error.message;
    btn.disabled = false; btn.textContent = "Enter your universe";
  }
}

async function signUpWithPassword() {
  var email = document.getElementById("authEmailPw").value.trim();
  var password = document.getElementById("authPassword").value;
  var errEl = document.getElementById("authErrorPw");
  if (!email || email.indexOf("@") < 0) { errEl.textContent = "Please enter a valid email."; return; }
  if (!password || password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
  errEl.textContent = "";
  var btn = document.getElementById("authBtnSignup");
  btn.disabled = true; btn.textContent = "Creating...";
  var result = await db.auth.signUp({ email: email, password: password });
  if (result.error) {
    errEl.textContent = result.error.message;
    btn.disabled = false; btn.textContent = "Create account";
  } else {
    document.getElementById("authFormPassword").style.display = "none";
    document.getElementById("authSentConfirm").style.display = "block";
  }
}

// ── MAGIC LINK ──
async function sendMagicLink() {
  var email = document.getElementById("authEmail").value.trim();
  if (!email || email.indexOf("@") < 0) {
    document.getElementById("authError").textContent = "Please enter a valid email.";
    return;
  }
  document.getElementById("authError").textContent = "";
  var btn = document.getElementById("authBtn");
  btn.disabled = true; btn.textContent = "Sending...";
  var result = await db.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin } });
  if (result.error) {
    document.getElementById("authError").textContent = result.error.message;
    btn.disabled = false; btn.textContent = "Send magic link";
  } else {
    document.getElementById("authFormMagic").style.display = "none";
    document.getElementById("authSent").style.display = "block";
    document.getElementById("authSentEmail").textContent = email;
  }
}

// ── SIGN OUT ──
async function signOut() {
  await db.auth.signOut();
  currentUser = null; USER_ID = null;
  location.reload();
}

function showLogin() {
  document.getElementById("authScreen").style.display = "flex";
  document.getElementById("onboarding").style.display = "none";
  document.getElementById("app").style.display = "none";
}
function showApp() {
  document.getElementById("authScreen").style.display = "none";
  initApp();
}
