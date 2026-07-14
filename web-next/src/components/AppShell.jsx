import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home as HomeIcon, Users, Compass, User, Plus } from "lucide-react";
import AddItemModal from "./pursue/AddItemModal";

const TABS = [
  { to: "/", label: "Home", end: true },
  { to: "/community", label: "Community" },
  { to: "/journey", label: "Journey" },
  { to: "/profile", label: "You" }
];

export default function AppShell() {
  const [mode, setMode] = useState("light");
  const [addOpen, setAddOpen] = useState(false);
  const location = useLocation();
  const isPrimary = TABS.some(t => (t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)));

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
  }

  return (
    <div className="min-h-screen bg-black flex justify-center py-8 px-3 font-sans">
      <div>
        <div className="w-[390px] h-[820px] bg-bg border border-borderC rounded-[40px] overflow-hidden relative flex flex-col">
          <div className="h-11 flex-none flex items-center justify-between px-5 text-[13px] text-textSecondary">
            <span>9:41</span>
            <span className="font-serif">YOU</span>
            <button
              onClick={toggleMode}
              className="border border-borderC bg-surface1 text-textSecondary text-[11px] px-2.5 py-1 rounded-full"
            >
              {mode === "light" ? "dark mode" : "light mode"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[76px] bg-surface2 border-t border-borderC flex items-center">
            <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
              <HomeIcon size={20} strokeWidth={1.75} className="mx-auto mb-1" />
              Home
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => tabClass(isActive)}>
              <Users size={20} strokeWidth={1.75} className="mx-auto mb-1" />
              Community
            </NavLink>
            <button onClick={() => setAddOpen(true)} className="flex-1 text-center text-label text-textMuted pt-1.5">
              <div className="w-9 h-9 rounded-full bg-forestAccent mx-auto -mt-4 mb-1.5 flex items-center justify-center">
                <Plus size={18} strokeWidth={2} className="text-surface2" />
              </div>
              Add
            </button>
            <NavLink to="/journey" className={({ isActive }) => tabClass(isActive)}>
              <Compass size={20} strokeWidth={1.75} className="mx-auto mb-1" />
              Journey
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => tabClass(isActive)}>
              <User size={20} strokeWidth={1.75} className="mx-auto mb-1" />
              You
            </NavLink>
          </div>
        </div>
        <div className="text-center text-textMuted text-caption mt-3.5 max-w-[390px]">
          {isPrimary ? "Primary tab" : "Secondary screen — back arrow returns to where you came from"}
        </div>
      </div>

      {addOpen && <AddItemModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function tabClass(isActive) {
  return `flex-1 text-center text-label pt-1.5 ${isActive ? "text-gold" : "text-textMuted"}`;
}
