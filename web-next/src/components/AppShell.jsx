import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
              <Dot active={location.pathname === "/"} />
              Home
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => tabClass(isActive)}>
              <Dot active={location.pathname.startsWith("/community")} />
              Community
            </NavLink>
            <button onClick={() => setAddOpen(true)} className="flex-1 text-center text-[11px] text-textMuted pt-1.5">
              <div className="w-8 h-8 rounded-full bg-forestAccent mx-auto -mt-3.5 mb-1.5" />
              Add
            </button>
            <NavLink to="/journey" className={({ isActive }) => tabClass(isActive)}>
              <Dot active={location.pathname.startsWith("/journey")} />
              Journey
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => tabClass(isActive)}>
              <Dot active={location.pathname.startsWith("/profile")} />
              You
            </NavLink>
          </div>
        </div>
        <div className="text-center text-textMuted text-[12px] mt-3.5 max-w-[390px]">
          {isPrimary ? "Primary tab" : "Secondary screen — back arrow returns to where you came from"}
        </div>
      </div>

      {addOpen && <AddItemModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function tabClass(isActive) {
  return `flex-1 text-center text-[11px] pt-1.5 ${isActive ? "text-gold" : "text-textMuted"}`;
}
function Dot({ active }) {
  return <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${active ? "bg-gold" : "bg-textMuted"}`} />;
}
