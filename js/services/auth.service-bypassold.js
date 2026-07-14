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
    document.getElementById("authForm").style.display = "none";
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
