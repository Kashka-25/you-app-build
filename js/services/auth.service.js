// auth.service.js - magic link authentication
// Part of the YOU app. Loaded via index.html in dependency order.

// ── DEV MODE ──────────────────────────────────────────────
// "bypass"     → skip login + onboarding, straight into app
// "onboarding" → skip login, show onboarding flow
// "live"       → normal magic link auth (use for production)
var DEV_MODE = "bypass";
// ──────────────────────────────────────────────────────────

// ── AUTH ──
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

function switchAuthTab(tab) {
  var pwPanel = document.getElementById("authPanelPassword");
  var mgPanel = document.getElementById("authPanelMagic");
  var tabPw   = document.getElementById("tabPassword");
  var tabMg   = document.getElementById("tabMagic");
  if (tab === "password") {
    pwPanel.style.display = ""; mgPanel.style.display = "none";
    tabPw.classList.add("active"); tabMg.classList.remove("active");
  } else {
    pwPanel.style.display = "none"; mgPanel.style.display = "";
    tabMg.classList.add("active"); tabPw.classList.remove("active");
  }
}

async function signInWithPassword() {
  var email = document.getElementById("authEmailPw").value.trim();
  var password = document.getElementById("authPassword").value;
  var err = document.getElementById("authErrorPw");
  err.textContent = "";
  if (!email || !password) { err.textContent = "Please enter your email and password."; return; }
  var btn = document.getElementById("authBtnLogin");
  btn.disabled = true; btn.textContent = "Entering...";
  var result = await db.auth.signInWithPassword({ email, password });
  if (result.error) {
    err.textContent = result.error.message;
    btn.disabled = false; btn.textContent = "Enter your universe";
  }
}

async function signUpWithPassword() {
  var email = document.getElementById("authEmailPw").value.trim();
  var password = document.getElementById("authPassword").value;
  var err = document.getElementById("authErrorPw");
  err.textContent = "";
  if (!email || !password) { err.textContent = "Please enter your email and a password."; return; }
  if (password.length < 6) { err.textContent = "Password must be at least 6 characters."; return; }
  var btn = document.getElementById("authBtnSignup");
  btn.disabled = true; btn.textContent = "Creating...";
  var result = await db.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
  if (result.error) {
    err.textContent = result.error.message;
    btn.disabled = false; btn.textContent = "Create account";
  } else {
    document.getElementById("authFormPassword").style.display = "none";
    document.getElementById("authSentConfirm").style.display = "block";
  }
}

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
