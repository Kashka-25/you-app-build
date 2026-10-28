import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import SignIn, { SetNewPassword } from "./components/SignIn";
import ErrorBoundary from "./components/ErrorBoundary";
import Welcome from "./components/Welcome";
import { introSeen } from "./components/Intro";
import WelcomeLab from "./components/WelcomeLab";
import Universe from "./components/welcome/Universe";
import KronkCallback from "./components/KronkCallback";
import ConfirmEmail from "./components/ConfirmEmail";
import Community from "./components/screens/Community";
import { KRONK_CALLBACK_PATH } from "./lib/kronk";
import Privacy from "./components/screens/Privacy";
import AppShell from "./components/AppShell";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import Home from "./components/screens/Home";
import BringMeBackToMyself from "./components/screens/BringMeBackToMyself";
import Journey from "./components/screens/Journey";
import You from "./components/screens/You";
import Pursue from "./components/screens/Pursue";
import Empatherapy from "./components/screens/Empatherapy";
import ShowcaseGallery from "./components/screens/ShowcaseGallery";
import YOUriginSpace from "./components/screens/YOUriginSpace";
import ShowcaseReview from "./components/screens/ShowcaseReview";
import Reflections from "./components/screens/Reflections";
import Legacy from "./components/screens/Legacy";
import Mirror from "./components/screens/Mirror";
import MyStory from "./components/screens/MyStory";
import Settings from "./components/screens/Settings";
import Styleguide from "./components/screens/Styleguide";
import Threshold, { THRESHOLD_SEEN } from "./components/screens/Threshold";
import SowScreen from "./components/sow/SowScreen";
import HarvestScreen from "./components/sow/HarvestScreen";
import FocusScreen from "./components/focus/FocusScreen";
import FocusWatcher from "./components/focus/FocusWatcher";
import YOUniversity from "./components/youniversity/YOUniversity";
import ArcanumScreen from "./components/youniversity/ArcanumScreen";
import OwnToolScreen from "./components/youniversity/OwnToolScreen";
import CoursePlayer from "./components/course/CoursePlayer";
import CourseToolScreen from "./components/course/CourseToolScreen";
import CodexRequests from "./components/screens/CodexRequests";
import BuildNotes from "./components/screens/BuildNotes";
import BetaInbox from "./components/screens/BetaInbox";
import WhatsNew from "./components/screens/WhatsNew";
import Extras from "./components/screens/Extras";
import { ProjectsLayout, ProjectsHome, ProjectView } from "./components/projects/ProjectsSpace";
import FindYourWay from "./components/screens/FindYourWay";
// Loaded on demand: the map library is large, and only a Wandering needs it.
const WanderingScreen = lazy(() => import("./components/wandering/WanderingScreen"));
import { ParkedScreen } from "./components/Primitives";
import { thresholdOnOpen } from "./lib/week";
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

// Opening the app lands on the Threshold first — once per session, only
// when arriving at Home (a deep link goes where it points), and only if
// the Seeker hasn't switched it off in My YOU.
function useThresholdOnOpen(ready) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!ready || location.pathname !== "/" || !thresholdOnOpen()) return;
    let seen = false;
    try { seen = sessionStorage.getItem(THRESHOLD_SEEN) === "1"; } catch { /* ignore */ }
    if (!seen) navigate("/threshold", { replace: true });
  }, [ready]);
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
  useThresholdOnOpen(!loading && Boolean(userId) && !recovering && !welcoming);
  useSectionElement();
  useColourScale(prefs?.colour_scale);

  // Readable before signing up, so it's checked before the auth gate.
  if (pathname === "/privacy") return <Privacy />;
  // Kronk's sign-in comes back here, signed in (connecting) or not (Continue with Kronk).
  if (pathname === KRONK_CALLBACK_PATH) return <KronkCallback />;
  // Links in account emails (confirm, reset) land here, signed in or not.
  if (pathname === "/auth/confirm") return <ConfirmEmail />;
  // A link to share: what YOU is and how to install it, signed in or not.
  // The welcome lab: a few versions of that page, to try side by side.
  if (pathname === "/welcome" || pathname === "/welcome-lab") {
    const Page = pathname === "/welcome" ? Universe : WelcomeLab;
    return (
      <Page
        onContinue={mode => {
          setSignInMode(mode);
          navigate("/", { replace: true });
        }}
      />
    );
  }

  if (loading) {
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
    <Routes>
      <Route path="/styleguide" element={<Styleguide />} />
      {/* Full-screen layers, outside the shell: no top bar, no nav. */}
      <Route path="/threshold" element={<Threshold />} />
      <Route path="/sow" element={<SowScreen />} />
      <Route path="/harvest" element={<HarvestScreen />} />
      <Route path="/focus" element={<FocusScreen />} />
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
        <Route path="/mirror" element={<Mirror />} />
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
    </ErrorBoundary>
  );
}
