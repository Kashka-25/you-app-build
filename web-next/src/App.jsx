import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./components/screens/Home";
import Community from "./components/screens/Community";
import Journey from "./components/screens/Journey";
import Profile from "./components/screens/Profile";
import Pursue from "./components/screens/Pursue";
import Atlas from "./components/screens/Atlas";
import Tree from "./components/screens/Tree";
import Constellations from "./components/screens/Constellations";
import Healing from "./components/screens/Healing";
import Empatherapy from "./components/screens/Empatherapy";
import Events from "./components/screens/Events";
import AICompanion from "./components/screens/AICompanion";
import Reflections from "./components/screens/Reflections";
import Legacy from "./components/screens/Legacy";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/pursue" element={<Pursue />} />
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/tree" element={<Tree />} />
        <Route path="/constellations" element={<Constellations />} />
        <Route path="/healing" element={<Healing />} />
        <Route path="/empatherapy" element={<Empatherapy />} />
        <Route path="/events" element={<Events />} />
        <Route path="/ai-companion" element={<AICompanion />} />
        <Route path="/reflections" element={<Reflections />} />
        <Route path="/legacy" element={<Legacy />} />
      </Route>
    </Routes>
  );
}
