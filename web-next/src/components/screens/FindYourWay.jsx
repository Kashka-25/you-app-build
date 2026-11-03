import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Menu, MessageSquareHeart, Plus } from "lucide-react";
import { SectionTitle } from "../Primitives";

// A map of YOU for testers and anyone new (Cassidy, Oct 22: "super easy to
// understand how to use it"). One line per place, a way to go there, and a
// short list of what to try first. Linked from Settings.

// The simple core (Nov 3): the bar holds Home, YOUrnal, Add, PursYOUts and
// YOU by default; YOUrney is in the menu, and everything else is an Extra.
const BOTTOM_BAR = [
  { icon: "home", name: "Home", to: "/", says: "Your day at a glance: check in with how you feel, and see what today holds." },
  { icon: "reflections", name: "YOUrnal", to: "/reflections", says: "Everything you've written: entries, ideas, dreams and photos of handwritten pages." },
  { add: true, name: "Add", says: "The round + button. Add a habit, goal or dream, or a journal entry." },
  { icon: "pursuits", name: "PursYOUts", to: "/pursue", says: "Everything you're growing: habits, goals and dreams, by Pillar, with what you've completed folded underneath." },
  { icon: "you", name: "YOU", to: "/you", says: "Your Pillars and Values. They grow and level up as you tend to your life." }
];

const MENU = [
  { icon: "yourney", name: "YOUrney", to: "/journey", says: "The big picture: your memories, the chapters of your life, and who you're becoming." },
  { name: "Extras", to: "/extras", says: "Switch on more when you want it: YOUniversity, KommYOUnity, Showcase, Focus, YOUr Projects and more. Each one then appears in this menu." },
  { name: "Settings", to: "/settings", says: "Tap your picture at the top right: your profile, Extras, colours and your data. What's new and this map live there too." },
  { icon: "light-dark", name: "Nature or Cosmos", says: "The switch at the bottom of the menu: earthy light, or the night sky." }
];

const FIRST_STEPS = [
  { to: "/sow", text: "Sow your week", sub: "Choose up to three of your PursYOUts to focus on this week. About five minutes." },
  { to: "/reflections", text: "Write in your YOUrnal", sub: "A few lines about today is plenty." },
  { to: "/you", text: "Bring a value into focus", sub: "Open Values on YOU and choose one that matters to you." },
  { to: "/", text: "Check in on Home", sub: "Say how you're arriving today. It only takes a tap." }
];

function Emblem({ icon, add }) {
  if (add) {
    return (
      <span className="w-[34px] h-[34px] rounded-full bg-forestAccent flex items-center justify-center flex-none">
        <Plus size={17} strokeWidth={2} className="text-onAccent" />
      </span>
    );
  }
  if (!icon) return <span className="w-[34px] flex-none" aria-hidden="true" />;
  return <img src={`/images/icons/${icon}.png`} alt="" width="34" height="34" className="w-[34px] h-[34px] flex-none" />;
}

function Place({ place }) {
  const body = (
    <>
      <Emblem icon={place.icon} add={place.add} />
      <span className="flex-1 min-w-0">
        <span className="block text-body text-textPrimary font-medium">{place.name}</span>
        <span className="block text-bodySm text-textSecondary">{place.says}</span>
      </span>
      {place.to && <ArrowRight size={16} strokeWidth={1.75} className="text-textMuted flex-none mt-1" aria-hidden="true" />}
    </>
  );
  const cls = "flex items-start gap-3 py-3 border-b border-borderC last:border-b-0";
  return place.to ? <Link to={place.to} className={`${cls} hover:bg-surface2 -mx-2 px-2 rounded-sm`}>{body}</Link> : <div className={cls}>{body}</div>;
}

function Card({ title, lead, children }) {
  return (
    <section className="rounded-card bg-surface1 shadow-card px-4 py-3 mb-4">
      <h2 className="font-serif text-h3 text-textPrimary mt-1 mb-0.5">{title}</h2>
      {lead && <p className="text-bodySm text-textMuted mb-1">{lead}</p>}
      {children}
    </section>
  );
}

export default function FindYourWay() {
  const { openFeedback } = useOutletContext() || {};
  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>Find your way</SectionTitle>
      <p className="text-body text-textSecondary mb-5">
        A quick map of YOU. Tap any place to go there, and come back here from Settings whenever you need it.
      </p>

      <Card title="Start here" lead="Four small things to try in your first few days.">
        <ol className="mt-1">
          {FIRST_STEPS.map((s, n) => (
            <li key={s.text}>
              <Link to={s.to} className="flex items-start gap-3 py-3 border-b border-borderC hover:bg-surface2 -mx-2 px-2 rounded-sm">
                <span className="w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-gold text-caption font-semibold flex items-center justify-center flex-none">
                  {n + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body text-textPrimary font-medium">{s.text}</span>
                  <span className="block text-bodySm text-textSecondary">{s.sub}</span>
                </span>
                <ArrowRight size={16} strokeWidth={1.75} className="text-textMuted flex-none mt-1.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => openFeedback?.()} className="w-full text-left flex items-start gap-3 py-3 hover:bg-surface2 -mx-2 px-2 rounded-sm">
              <span className="w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-gold text-caption font-semibold flex items-center justify-center flex-none">
                5
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-body text-textPrimary font-medium">Tell us what you think</span>
                <span className="block text-bodySm text-textSecondary">Something confusing, broken or lovely? Every note helps.</span>
              </span>
              <MessageSquareHeart size={16} strokeWidth={1.75} className="text-gold flex-none mt-1.5" aria-hidden="true" />
            </button>
          </li>
        </ol>
      </Card>

      <Card title="The bar at the bottom" lead="Always there on your phone. Home, Add and YOU stay put; the two either side of Add are yours to choose in Extras.">
        {BOTTOM_BAR.map(p => <Place key={p.name} place={p} />)}
      </Card>

      <Card
        title="The menu"
        lead={<>Tap <Menu size={13} strokeWidth={2} className="inline -mt-0.5" aria-label="the menu button" /> at the top left for everything else.</>}
      >
        {MENU.map(p => <Place key={p.name} place={p} />)}
      </Card>

      <Card title="While YOU is in beta">
        <ul className="space-y-2.5 text-bodySm text-textSecondary my-2">
          <li><b className="text-textPrimary font-medium">Send feedback</b> is in the menu. Pick “Something’s not right”, “An idea” or “Something I love”. It notes which screen you were on, so just say what happened.</li>
          <li><b className="text-textPrimary font-medium">If something breaks</b>, YOU quietly lets us know, so there's no need to report every hiccup.</li>
          <li><b className="text-textPrimary font-medium">What you write is yours.</b> Only you can see it. AI reflections stay off until you say yes.</li>
          <li><b className="text-textPrimary font-medium">Your data</b> can be downloaded or deleted any time in Settings.</li>
          <li><b className="text-textPrimary font-medium">Some things will change.</b> Pages marked Coming soon are still being built.</li>
        </ul>
      </Card>
    </div>
  );
}
