import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home as HomeIcon, NotebookPen, Compass, User, Plus } from "lucide-react";
import AddItemModal from "./pursue/AddItemModal";
import AddMomentModal from "./journey/AddMomentModal";
import AddActionSheet from "./AddActionSheet";
import TopBar from "./TopBar";
import SidebarMenu, { MenuContents } from "./SidebarMenu";
import AiConsentModal from "./AiConsentModal";

export default function AppShell() {
  // Remembered on this device; index.html applies it before the first paint.
  const [mode, setMode] = useState(() => (document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light"));
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("habit");
  const [momentOpen, setMomentOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Home spreads out into a grid on a laptop; every other screen keeps its
  // readable column.
  const wide = useLocation().pathname === "/";

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
    try { localStorage.setItem("you.mode", next); } catch { /* private mode: just this visit */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0B0B1F" : "#3A2618");
  }

  return (
    // Fills the real device viewport edge to edge on phones. On wider
    // screens it stays a single readable column (no full-bleed stretch of a
    // nav bar designed for 4-5 items) but never boxes the app in a
    // phone-shaped mockup — no fixed device width/height, no border, no
    // rounded "bezel", no black backdrop.
    // Phones: the real viewport edge to edge, top bar and bottom tabs.
    // Laptops (lg): a fixed sidebar with the full menu, and no phone chrome.
    // Never boxed in a phone-shaped mockup.
    <div className="h-dvh you-sky flex font-sans">
      <aside className="hidden lg:flex w-[248px] flex-none flex-col h-dvh py-5 bg-[color-mix(in_srgb,var(--surface-2)_85%,transparent)] backdrop-blur-md border-r border-borderC">
        <NavLink to="/" className="block px-5 mb-5" aria-label="YOU, home">
          <img src="/logo-wordmark.png" alt="YOU — Your Own Universe" className="h-16 w-auto" />
        </NavLink>
        <div className="px-5 mb-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full bg-forestAccent text-onAccent text-bodySm font-medium hover:bg-forest"
          >
            <Plus size={17} strokeWidth={2} /> Add
          </button>
        </div>
        <MenuContents mode={mode} onToggleMode={toggleMode} />
      </aside>

      <div className="flex-1 min-w-0 flex justify-center">
      <div className={`w-full max-w-[640px] ${wide ? "lg:max-w-[1160px]" : ""} h-dvh relative flex flex-col overflow-hidden`}>
        <div style={{ paddingTop: "env(safe-area-inset-top)" }} className="lg:hidden flex-none bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)] backdrop-blur-md">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
        </div>

        <div className="flex-1 overflow-y-auto lg:pt-6 lg:px-4">
          <Outlet />
        </div>

        <div
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="lg:hidden absolute bottom-0 left-0 right-0 min-h-[76px] bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)] backdrop-blur-md border-t border-borderC flex items-center"
        >
          <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
            <HomeIcon size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            Home
          </NavLink>
          <NavLink to="/journey" className={({ isActive }) => tabClass(isActive)}>
            <Compass size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            YOUrney
          </NavLink>
          <button onClick={() => setSheetOpen(true)} className="flex-1 text-center text-label text-textMuted pt-1.5">
            <div className="w-9 h-9 rounded-full bg-forestAccent mx-auto -mt-4 mb-1.5 flex items-center justify-center">
              <Plus size={18} strokeWidth={2} className="text-onAccent" />
            </div>
            Add
          </button>
          {/* Reflections, named YOUrnal in the tab bar (Cassidy, Oct 18).
              CommYOUnity stays in the side menu. */}
          <NavLink to="/reflections" className={({ isActive }) => tabClass(isActive)}>
            <NotebookPen size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            YOUrnal
          </NavLink>
          <NavLink to="/you" className={({ isActive }) => tabClass(isActive)}>
            <User size={20} strokeWidth={1.75} className="mx-auto mb-1" />
            YOU
          </NavLink>
        </div>

        <SidebarMenu open={menuOpen} onClose={() => setMenuOpen(false)} mode={mode} onToggleMode={toggleMode} />
      </div>
      </div>

      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} defaultType={addType} />
      <AddMomentModal open={momentOpen} onClose={() => setMomentOpen(false)} />
      <AiConsentModal />
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
  return `flex-1 text-center text-label pt-1.5 ${isActive ? "text-element" : "text-textMuted"}`;
}
