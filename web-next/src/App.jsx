import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./components/screens/Home";
import Community from "./components/screens/Community";
import Journey from "./components/screens/Journey";
import You from "./components/screens/You";
import Pursue from "./components/screens/Pursue";
import Atlas from "./components/screens/Atlas";
import Healing from "./components/screens/Healing";
import Empatherapy from "./components/screens/Empatherapy";
import Events from "./components/screens/Events";
import Reflections from "./components/screens/Reflections";
import Legacy from "./components/screens/Legacy";
import Therapists from "./components/screens/Therapists";
import Shop from "./components/screens/Shop";
import Challenges from "./components/screens/Challenges";
import Saved from "./components/screens/Saved";
import Review from "./components/screens/Review";
import Settings from "./components/screens/Settings";
import Styleguide from "./components/screens/Styleguide";

export default function App() {
  return (
    <Routes>
      <Route path="/styleguide" element={<Styleguide />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/you" element={<You />} />
        <Route path="/pursue" element={<Pursue />} />
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/healing" element={<Healing />} />
        <Route path="/empatherapy" element={<Empatherapy />} />
        <Route path="/events" element={<Events />} />
        <Route path="/reflections" element={<Reflections />} />
        <Route path="/legacy" element={<Legacy />} />
        <Route path="/therapists" element={<Therapists />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
