import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home as HomeIcon, Users, Compass, User, Plus } from "lucide-react";
import AddItemModal from "./pursue/AddItemModal";
import AddMomentModal from "./journey/AddMomentModal";
import AddActionSheet from "./AddActionSheet";
import TopBar from "./TopBar";
import SidebarMenu from "./SidebarMenu";

export default function AppShell() {
  const [mode, setMode] = useState("light");
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("habit");
  const [momentOpen, setMomentOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
  }

  return (
    // Fills the real device viewport edge to edge on phones. On wider
    // screens it stays a single readable column (no full-bleed stretch of a
    // nav bar designed for 4-5 items) but never boxes the app in a
    // phone-shaped mockup — no fixed device width/height, no border, no
    // rounded "bezel", no black backdrop.
    <div className="h-dvh bg-bg flex justify-center font-sans">
      <div className="w-full max-w-[640px] h-dvh bg-bg relative flex flex-col overflow-hidden">
        <div style={{ paddingTop: "env(safe-area-inset-top)" }} className="flex-none bg-surface2">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        <div
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="absolute bottom-0 left-0 right-0 min-h-[76px] bg-surface2 border-t border-borderC flex items-center"
        >
          <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
            <HomeIcon size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            Home
          </NavLink>
          <NavLink to="/journey" className={({ isActive }) => tabClass(isActive)}>
            <Compass size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            Journey
          </NavLink>
          <button onClick={() => setSheetOpen(true)} className="flex-1 text-center text-label text-textMuted pt-1.5">
            <div className="w-9 h-9 rounded-full bg-forestAccent mx-auto -mt-4 mb-1.5 flex items-center justify-center">
              <Plus size={18} strokeWidth={2} className="text-surface2" />
            </div>
            Add
          </button>
          <NavLink to="/community" className={({ isActive }) => tabClass(isActive)}>
            <Users size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            CommYOUnity
          </NavLink>
          <NavLink to="/you" className={({ isActive }) => tabClass(isActive)}>
            <User size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            YOU
          </NavLink>
        </div>

        <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} mode={mode} onToggleMode={toggleMode} />
      </div>

      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} defaultType={addType} />
      <AddMomentModal open={momentOpen} onClose={() => setMomentOpen(false)} />
      <AddActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelectPursue={type => { setAddType(type); setAddOpen(true); }}
        onSelectMoment={() => setMomentOpen(true)}
      />
    </div>
  );
}

function tabClass(isActive) {
  return `flex-1 text-center text-label pt-1.5 ${isActive ? "text-gold" : "text-textMuted"}`;
}
