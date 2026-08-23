import { Routes, Route } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import SignIn from "./components/SignIn";
import AppShell from "./components/AppShell";
import Home from "./components/screens/Home";
import Journey from "./components/screens/Journey";
import You from "./components/screens/You";
import Pursue from "./components/screens/Pursue";
import Empatherapy from "./components/screens/Empatherapy";
import Reflections from "./components/screens/Reflections";
import Legacy from "./components/screens/Legacy";
import Settings from "./components/screens/Settings";
import Styleguide from "./components/screens/Styleguide";
import { ParkedScreen } from "./components/Primitives";

export default function App() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex justify-center items-center py-8 px-3 font-sans">
        <div className="text-textSecondary text-bodySm">Loading…</div>
      </div>
    );
  }
  if (!userId) return <SignIn />;

  return (
    <Routes>
      <Route path="/styleguide" element={<Styleguide />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/you" element={<You />} />
        <Route path="/pursue" element={<Pursue />} />

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
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
