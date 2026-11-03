import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppData } from "../lib/AppDataContext";
import { BetaBadge } from "./SignIn";
import NewInYou from "./NewInYou";

export default function TopBar({ onMenuClick }) {
  const { codexNew } = useAppData();
  return (
    <div className="relative h-16 flex-none flex items-center justify-between px-4 border-b border-borderC">
      <button onClick={onMenuClick} className="relative text-textPrimary p-1 -ml-1" aria-label={codexNew ? `Open menu, ${codexNew} new Codex request${codexNew === 1 ? "" : "s"}` : "Open menu"}>
        <Menu size={20} strokeWidth={1.75} />
        {/* Creator only: new Codex requests are waiting in the menu. */}
        {codexNew > 0 && <span className="absolute top-0 right-0 w-[8px] h-[8px] rounded-full bg-gold border border-surface2" />}
      </button>

      {/* Centred on the bar whatever sits either side of it. */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center flex items-center gap-1.5 pointer-events-none">
        {/* Keyed out to real transparency (not just a light-mode render), so
            the same gold mark works on both the light and dark TopBar. */}
        <img src="/logo-wordmark.png" alt="YOU — Your Own Universe" className="h-9 w-auto mx-auto" />
        <BetaBadge className="!text-[9px] !px-1.5" />
      </div>

      {/* No notifications yet, so no bell: a control that does nothing (and
          a dot that never clears) only adds noise. */}
      <div className="flex items-center gap-2.5">
        <NewInYou />
        {/* The Settings cog, in the emblem style (Cassidy, Nov 3). */}
        <Link to="/settings" className="relative w-9 h-9 flex-none before:absolute before:-inset-1 before:content-['']" aria-label="Settings">
          <img src="/images/icons/settings.png" alt="" width="36" height="36" className="w-9 h-9" />
        </Link>
      </div>
    </div>
  );
}
