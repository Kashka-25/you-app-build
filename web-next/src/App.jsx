import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import SignIn from "./components/SignIn";
import AppShell from "./components/AppShell";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import Home from "./components/screens/Home";
import BringMeBackToMyself from "./components/screens/BringMeBackToMyself";
import Journey from "./components/screens/Journey";
import You from "./components/screens/You";
import Pursue from "./components/screens/Pursue";
import Empatherapy from "./components/screens/Empatherapy";
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
// Loaded on demand: the map library is large, and only a Wandering needs it.
const WanderingScreen = lazy(() => import("./components/wandering/WanderingScreen"));
import { ParkedScreen } from "./components/Primitives";
import { thresholdOnOpen } from "./lib/week";

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
  const { userId, loading } = useAuth();
  useThresholdOnOpen(!loading && Boolean(userId));

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex justify-center items-center font-sans">
        <LoadingScreen label="Signing you in" />
      </div>
    );
  }
  if (!userId) return <SignIn />;

  return (
    <>
    <FocusWatcher />
    <Routes>
      <Route path="/styleguide" element={<Styleguide />} />
      {/* Full-screen layers, outside the shell: no top bar, no nav. */}
      <Route path="/threshold" element={<Threshold />} />
      <Route path="/sow" element={<SowScreen />} />
      <Route path="/harvest" element={<HarvestScreen />} />
      <Route path="/focus" element={<FocusScreen />} />
      <Route path="/my-story" element={<MyStory />} />
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

        {/* Real, working screens end here. Everything below is intentionally
            gated behind "coming soon" until it has a real backend/data
            source — don't wire mock-data screens back in without checking
            with Cassidy first. */}
        <Route path="/community" element={<ParkedScreen title="CommYOUnity" note="coming soon — being built" />} />
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
      </Route>
    </Routes>
    </>
  );
}
