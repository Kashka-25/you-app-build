import { Link } from "react-router-dom";
import { ArrowRight, Flame, Star, Target } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";

// PursYOUts on Home, under the journey card (Cassidy, Oct 27: "make
// pursuits more easily accessible", trying the name PursYOUts). What's
// growing at a glance, and one tap to all of it.
const TYPES = [
  { key: "habit", icon: Flame, one: "habit", many: "habits" },
  { key: "goal", icon: Target, one: "goal", many: "goals" },
  { key: "dream", icon: Star, one: "dream", many: "dreams" }
];

export default function PursYOUtsCard() {
  const { items } = useAppData();
  const growing = items.filter(i => !i.done);
  const counts = TYPES.map(t => ({ ...t, n: growing.filter(i => i.type === t.key).length })).filter(t => t.n > 0);
  const latest = [...growing].reverse().slice(0, 3);

  return (
    <section aria-labelledby="home-pursyouts" className="rounded-card bg-surface1 shadow-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <img src="/images/icons/pursuits@4x.png" alt="" width="52" height="52" className="w-[52px] h-[52px] flex-none -my-1" />
        <div className="flex-1 min-w-0">
          <h2 id="home-pursyouts" className="font-serif text-h3 text-textPrimary m-0">Your PursYOUts</h2>
          <p className="text-caption text-textMuted m-0">
            {counts.length ? counts.map(t => `${t.n} ${t.n === 1 ? t.one : t.many}`).join(" · ") + " growing" : "What you're growing: habits, goals and dreams."}
          </p>
        </div>
      </div>

      {latest.length > 0 && (
        <ul className="space-y-1 mb-1">
          {latest.map(i => {
            const T = TYPES.find(t => t.key === i.type) || TYPES[0];
            return (
              <li key={i.id} className="flex items-center gap-2.5 text-bodySm text-textPrimary min-h-[32px]">
                <T.icon size={14} strokeWidth={1.75} className="text-gold flex-none" aria-hidden="true" />
                <span className="truncate">{i.name}</span>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/pursue" className="mt-1 inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-forestAccent font-medium">
        {growing.length ? "Open your PursYOUts" : "Plant your first"} <ArrowRight size={15} strokeWidth={1.75} />
      </Link>
    </section>
  );
}
