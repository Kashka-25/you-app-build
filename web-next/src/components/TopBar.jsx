import { Menu, Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function TopBar({ onMenuClick }) {
  return (
    <div className="h-16 flex-none flex items-center justify-between px-4 border-b border-borderC bg-surface2">
      <button onClick={onMenuClick} className="text-textPrimary p-1 -ml-1" aria-label="Open menu">
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <div className="text-center">
        {/* The wordmark render has an opaque cream background baked in, so it
            only reads correctly in light mode — dark mode keeps the original
            text lockup rather than showing a pale box floating on a dark bar. */}
        <img src="/logo-wordmark.png" alt="YOU — Your Own Universe" className="h-9 w-auto mx-auto dark:hidden" />
        <div className="hidden dark:block">
          <div className="font-serif text-h3 text-gold leading-none">YOU</div>
          <div className="text-[8.5px] tracking-wide uppercase text-textMuted mt-0.5">Your Own Universe</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-textSecondary" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-ember border border-surface2" />
        </button>
        <Link to="/settings" className="relative w-8 h-8 flex-none" aria-label="My YOU">
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
