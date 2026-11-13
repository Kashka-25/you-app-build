import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import SignIn, { SetNewPassword } from "./components/SignIn";
import ErrorBoundary from "./components/ErrorBoundary";
import Welcome from "./components/Welcome";
import { introSeen } from "./components/Intro";
import Universe from "./components/welcome/Universe";
// The demo's way in (lib/demo/mode.js): its own small chunk.
const DemoGate = lazy(() => import("./components/demo/DemoGate"));
import KronkCallback from "./components/KronkCallback";
import ConfirmEmail from "./components/ConfirmEmail";
import { KRONK_CALLBACK_PATH } from "./lib/kronk";
import Privacy from "./components/screens/Privacy";
import AppShell from "./components/AppShell";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import Home from "./components/screens/Home";
import BringMeBackToMyself from "./components/screens/BringMeBackToMyself";
import Journey from "./components/screens/Journey";
import You from "./components/screens/You";
import Pursue from "./components/screens/Pursue";
import Reflections from "./components/screens/Reflections";
import Threshold, { THRESHOLD_SEEN } from "./components/screens/Threshold";
import FocusWatcher from "./components/focus/FocusWatcher";
// Loaded on demand (Nov 4): the five core places, sign-in and the welcome
// come with the app; every other screen is fetched the first time it's
// opened, so the first open on a phone is lighter. The service worker
// precaches every chunk, so they still open offline.
// After a new deploy an open app can ask for a chunk that no longer
// exists; then it reloads once to pick up the new build.
function page(load, pick = m => m.default) {
  return lazy(() => load().then(m => ({ default: pick(m) })).catch(err => {
    let reloaded = false;
    try { reloaded = sessionStorage.getItem("you.chunk-reload") === "1"; sessionStorage.setItem("you.chunk-reload", "1"); } catch { /* ignore */ }
    if (!reloaded) { window.location.reload(); return new Promise(() => {}); }
    throw err;
  }));
}
try { sessionStorage.removeItem("you.chunk-reload"); } catch { /* ignore */ }

// The map library is large, and only a Wandering needs it.
const WanderingScreen = page(() => import("./components/wandering/WanderingScreen"));
const WelcomeLab = page(() => import("./components/WelcomeLab"));
const Community = page(() => import("./components/screens/Community"));
const Empatherapy = page(() => import("./components/screens/Empatherapy"));
const ShowcaseGallery = page(() => import("./components/screens/ShowcaseGallery"));
const YOUriginSpace = page(() => import("./components/screens/YOUriginSpace"));
const ShowcaseReview = page(() => import("./components/screens/ShowcaseReview"));
const Legacy = page(() => import("./components/screens/Legacy"));
const MyStory = page(() => import("./components/screens/MyStory"));
const Settings = page(() => import("./components/screens/Settings"));
const Styleguide = page(() => import("./components/screens/Styleguide"));
const SowScreen = page(() => import("./components/sow/SowScreen"));
const HarvestScreen = page(() => import("./components/sow/HarvestScreen"));
const FocusScreen = page(() => import("./components/focus/FocusScreen"));
const YOUniversity = page(() => import("./components/youniversity/YOUniversity"));
const ArcanumScreen = page(() => import("./components/youniversity/ArcanumScreen"));
const OwnToolScreen = page(() => import("./components/youniversity/OwnToolScreen"));
const CoursePlayer = page(() => import("./components/course/CoursePlayer"));
const CourseToolScreen = page(() => import("./components/course/CourseToolScreen"));
const CodexRequests = page(() => import("./components/screens/CodexRequests"));
const BuildNotes = page(() => import("./components/screens/BuildNotes"));
const BetaInbox = page(() => import("./components/screens/BetaInbox"));
const SeasonReview = page(() => import("./components/journey/SeasonReview"));
const FutureSelfScreen = page(() => import("./components/journey/FutureSelfScreen"));
const WhatsNew = page(() => import("./components/screens/WhatsNew"));
const Extras = page(() => import("./components/screens/Extras"));
const FindYourWay = page(() => import("./components/screens/FindYourWay"));
const ProjectsLayout = page(() => import("./components/projects/ProjectsSpace"), m => m.ProjectsLayout);
const ProjectsHome = page(() => import("./components/projects/ProjectsSpace"), m => m.ProjectsHome);
const ProjectView = page(() => import("./components/projects/ProjectsSpace"), m => m.ProjectView);
import { ParkedScreen } from "./components/Primitives";
import { useSectionElement } from "./lib/elements";
import { applyScale, readScale, storeScale, watchMode } from "./lib/colourScale";

// The Seeker's colour scale: painted now and on every mode flip, and taken
// from their account when it differs from this device (a change made on
// another phone follows them here).
function useColourScale(fromAccount) {
  useEffect(() => { watchMode(); applyScale(); }, []);
  useEffect(() => {
    if (!fromAccount) return;
    const here = readScale();
    if (here.light === fromAccount.light && here.dark === fromAccount.dark) return;
    const next = { ...here, ...fromAccount };
    storeScale(next);
    applyScale(next);
  }, [fromAccount?.light, fromAccount?.dark]);
}

// With the Threshold extra on (Nov 3: an extra, off to start), opening the
// app lands on the Threshold first — once per session, only when arriving
// at Home (a deep link goes where it points).
function useThresholdOnOpen(ready, on) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!ready || !on || location.pathname !== "/") return;
    let seen = false;
    try { seen = sessionStorage.getItem(THRESHOLD_SEEN) === "1"; } catch { /* ignore */ }
    if (!seen) navigate("/threshold", { replace: true });
  }, [ready]);
}

function PageLoading() {
  return (
    <div className="min-h-dvh bg-bg flex justify-center items-center font-sans">
      <LoadingScreen label="Opening" />
    </div>
  );
}

export default function App() {
  const { userId, loading, recovering, prefs } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Brand-new on this device: the welcome universe first, then sign-up or sign-in.
  const [signInMode, setSignInMode] = useState(() => (introSeen() ? "signin" : null));
  // First run: the welcome, once per account. Dismissed in this visit even
  // if saving the preference fails, so no one gets stuck in it.
  const [welcomeDone, setWelcomeDone] = useState(false);
  const welcoming = Boolean(userId) && !recovering && !prefs?.welcomed && !welcomeDone;
  // "See the welcome again" in Your Own Universe turns the preference off.
  useEffect(() => { if (prefs?.welcomed === false) setWelcomeDone(false); }, [prefs?.welcomed]);
  // The soft arrival (sprint C4): when the opening splash gives way to the
  // app, the first page fades in once, from the splash's own background.
  // Only after the splash was really shown, never again on later pages,
  // and not at all with reduced motion (tokens.css).
  const splashShown = useRef(false);
  useEffect(() => {
    if (loading || !splashShown.current) return;
    splashShown.current = false;
    document.getElementById("root")?.classList.add("you-arrive");
  }, [loading]);
  useThresholdOnOpen(!loading && Boolean(userId) && !recovering && !welcoming, Boolean(prefs?.plugins?.threshold));
  useSectionElement();
  useColourScale(prefs?.colour_scale);

  // Readable before signing up, so it's checked before the auth gate.
  if (pathname === "/privacy") return <Privacy />;
  // Try YOU (Creative Universe's "Try the demo"), signed in or not.
  if (pathname === "/demo") return <Suspense fallback={<PageLoading />}><DemoGate /></Suspense>;
  // Kronk's sign-in comes back here, signed in (connecting) or not (Continue with Kronk).
  if (pathname === KRONK_CALLBACK_PATH) return <KronkCallback />;
  // Links in account emails (confirm, reset) land here, signed in or not.
  if (pathname === "/auth/confirm") return <ConfirmEmail />;
  // A link to share: what YOU is and how to install it, signed in or not.
  // The welcome lab: a few versions of that page, to try side by side.
  if (pathname === "/welcome" || pathname === "/welcome-lab") {
    const Page = pathname === "/welcome" ? Universe : WelcomeLab;
    return (
      <Suspense fallback={<PageLoading />}>
        <Page
          onContinue={mode => {
            setSignInMode(mode);
            navigate("/", { replace: true });
          }}
        />
      </Suspense>
    );
  }

  if (loading) {
    splashShown.current = true;
    return (
      <div className="min-h-dvh bg-bg flex justify-center items-center font-sans">
        <LoadingScreen label="Signing you in" />
      </div>
    );
  }
  if (!userId) {
    if (!signInMode) return <Universe onContinue={setSignInMode} />;
    return <SignIn key={signInMode} initialMode={signInMode} onExit={() => setSignInMode(null)} />;
  }
  if (recovering) return <SetNewPassword />;
  if (welcoming) return <Welcome onDone={() => setWelcomeDone(true)} />;

  return (
    <ErrorBoundary key={pathname}>
    <FocusWatcher />
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/styleguide" element={<Styleguide />} />
      {/* Full-screen layers, outside the shell: no top bar, no nav. */}
      <Route path="/threshold" element={<Threshold />} />
      <Route path="/sow" element={<SowScreen />} />
      <Route path="/harvest" element={<HarvestScreen />} />
      <Route path="/focus" element={<FocusScreen />} />
      {/* The Season review: a full-screen story (lib/seasons.js). */}
      <Route path="/season-review" element={<SeasonReview />} />
      {/* Meet your future self: the Identity journey (Nov 4). */}
      <Route path="/future-self" element={<FutureSelfScreen />} />
      {/* YOUr Projects: its own space, outside the tab bar (lib/projects.js). */}
      <Route element={<ProjectsLayout />}>
        <Route path="/projects" element={<ProjectsHome />} />
        <Route path="/projects/:id" element={<ProjectView />} />
      </Route>
      <Route path="/my-story" element={<MyStory />} />
      <Route path="/learn/:slug/tool/:toolId" element={<CoursePlayer />} />
      <Route path="/learn/:slug/:partId" element={<CoursePlayer />} />
      <Route
        path="/wandering/:id"
        element={
          <Suspense fallback={<div className="min-h-dvh bg-bg flex justify-center items-center font-sans"><LoadingScreen label="Unfolding the map" /></div>}>
            <WanderingScreen />
          </Suspense>
        }
      />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/bring-me-back" element={<BringMeBackToMyself />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/you" element={<You />} />
        <Route path="/pursue" element={<Pursue />} />
        <Route path="/youniversity" element={<YOUniversity />} />
        <Route path="/youniversity/arcanum/:slug" element={<ArcanumScreen />} />
        <Route path="/youniversity/tool/:id" element={<OwnToolScreen />} />
        <Route path="/youniversity/arcanum/:slug/tool/:toolId" element={<CourseToolScreen />} />
        <Route path="/community" element={<Community />} />

        {/* Real, working screens end here. Everything below is intentionally
            gated behind "coming soon" until it has a real backend/data
            source — don't wire mock-data screens back in without checking
            with Cassidy first. */}
        <Route path="/atlas" element={<ParkedScreen title="Living Atlas" note="coming soon — being built" />} />
        <Route path="/healing" element={<ParkedScreen title="Healing Journey" note="coming soon — being built" />} />
        <Route path="/events" element={<ParkedScreen title="Events" note="coming soon — being built" />} />
        <Route path="/therapists" element={<ParkedScreen title="Therapists" note="coming soon — being built" />} />
        <Route path="/shop" element={<ParkedScreen title="Shop" note="coming soon — being built" />} />
        <Route path="/challenges" element={<ParkedScreen title="Challenges" note="coming soon — being built" />} />
        <Route path="/saved" element={<ParkedScreen title="Saved" note="coming soon — being built" />} />
        <Route path="/review" element={<ParkedScreen title="Review" note="coming soon — being built" />} />

        <Route path="/empatherapy" element={<Empatherapy />} />
        <Route path="/reflections" element={<Reflections />} />
        <Route path="/legacy" element={<Legacy />} />
        {/* The Mirror folded into YOUrney (Nov 5): a year ago is on Memories. */}
        <Route path="/mirror" element={<Navigate to="/journey" replace state={{ tab: "chapters" }} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/codex-requests" element={<CodexRequests />} />
        <Route path="/showcase" element={<ShowcaseGallery />} />
        <Route path="/yourigin" element={<YOUriginSpace />} />
        <Route path="/showcase-review" element={<ShowcaseReview />} />
        <Route path="/build-notes" element={<BuildNotes />} />
        <Route path="/tester-inbox" element={<BetaInbox />} />
        <Route path="/whats-new" element={<WhatsNew />} />
        <Route path="/extras" element={<Extras />} />
        <Route path="/find-your-way" element={<FindYourWay />} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
