import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";

// PursYOUts on Home, under the path card (Cassidy, Oct 27: "make pursuits
// more easily accessible"). Just a pill that opens them (Nov 1): today's
// habits are already in Today, so it doesn't repeat what's growing.
export default function PursYOUtsCard() {
  const { items } = useAppData();
  const growing = items.filter(i => !i.done).length;

  return (
    <Link
      to="/pursue"
      className="flex items-center gap-3 min-h-[56px] rounded-full bg-surface1 shadow-card pl-2 pr-4 active:scale-[0.99] transition"
    >
      <img src="/images/icons/pursuits@4x.png" alt="" width="44" height="44" className="w-11 h-11 flex-none" />
      <span className="flex-1 min-w-0">
        <span className="block font-serif text-h3 text-textPrimary leading-tight">Your PursYOUts</span>
        <span className="block text-caption text-textMuted">{growing ? `${growing} growing` : "Plant your first"}</span>
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
    </Link>
  );
}
