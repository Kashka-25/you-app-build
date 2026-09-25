import { Menu, Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function TopBar({ onMenuClick }) {
  return (
    <div className="h-16 flex-none flex items-center justify-between px-4 border-b border-borderC bg-surface2">
      <button onClick={onMenuClick} className="text-textPrimary p-1 -ml-1" aria-label="Open menu">
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <div className="text-center">
        {/* Keyed out to real transparency (not just a light-mode render), so
            the same gold mark works on both the light and dark TopBar. */}
        <img src="/logo-wordmark.png" alt="YOU — Your Own Universe" className="h-9 w-auto mx-auto" />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-textSecondary" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-ember border border-surface2" />
        </button>
        <Link to="/settings" className="relative w-8 h-8 flex-none" aria-label="Your Own Universe">
          <div
            className="w-8 h-8 rounded-full"
            style={{ background: "radial-gradient(circle at 35% 30%, var(--sage), var(--forest) 70%)" }}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full bg-gold border-2 border-surface2" />
        </Link>
      </div>
    </div>
  );
}
