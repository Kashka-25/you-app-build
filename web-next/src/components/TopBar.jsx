import { Menu, Bell } from "lucide-react";

export default function TopBar({ onMenuClick }) {
  return (
    <div className="h-16 flex-none flex items-center justify-between px-4 border-b border-borderC bg-surface2">
      <button onClick={onMenuClick} className="text-textPrimary p-1 -ml-1" aria-label="Open menu">
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <div className="text-center">
        <div className="font-serif text-h3 text-forest dark:text-gold leading-none">YOU</div>
        <div className="text-[8.5px] tracking-wide uppercase text-textMuted mt-0.5">Your Own Universe</div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-textSecondary" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full bg-ember border border-surface2" />
        </button>
        <div className="relative w-8 h-8 flex-none">
          <div
            className="w-8 h-8 rounded-full"
            style={{ background: "radial-gradient(circle at 35% 30%, var(--sage), var(--forest) 70%)" }}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full bg-gold border-2 border-surface2" />
        </div>
      </div>
    </div>
  );
}
