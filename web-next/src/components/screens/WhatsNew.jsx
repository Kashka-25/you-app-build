import { useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Lightbulb, Puzzle, Sparkles } from "lucide-react";
import { SectionTitle } from "../Primitives";
import { WHATS_NEW, useMarkWhatsNewSeen } from "../../lib/whatsNew";
import { PLUGINS, usePlugin, useSetPlugin } from "../../lib/plugins";
import { PluginRow } from "./Settings";

// What's new in YOU (Cassidy, Oct 27): new features as they arrive, the
// extras a Seeker can add to their own account, and a way to ask for more.
// Opening it clears the side menu's dot.

function niceDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

function NewCard({ item }) {
  const pluginOn = usePlugin(item.plugin || "__none");
  const setPlugin = useSetPlugin();
  const needsSwitch = item.plugin && !pluginOn;
  return (
    <article className="rounded-card bg-surface1 shadow-card p-4">
      <div className="text-label uppercase text-gold mb-1">{niceDate(item.date)}</div>
      <h3 className="font-serif text-h3 text-textPrimary m-0 mb-1">{item.title}</h3>
      <p className="text-bodySm text-textSecondary m-0">{item.body}</p>
      {(needsSwitch || item.to) && (
        <div className="mt-3">
          {needsSwitch ? (
            <button
              type="button"
              onClick={() => setPlugin(item.plugin, true).catch(e => console.error("[WhatsNew] switch on failed:", e))}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium"
            >
              <Puzzle size={15} strokeWidth={1.75} /> Add to my YOU
            </button>
          ) : (
            <Link to={item.to} className="inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-forestAccent font-medium">
              {item.open || "Take a look"} <ArrowRight size={15} strokeWidth={1.75} />
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export default function WhatsNew() {
  const { openFeedback } = useOutletContext() || {};
  const markSeen = useMarkWhatsNewSeen();
  const setPlugin = useSetPlugin();
  useEffect(() => { markSeen(); }, []);

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>What's new</SectionTitle>
      <p className="text-body text-textSecondary mb-5">
        YOU keeps growing. New things show up here first, along with extras you can add to your own YOU.
      </p>

      <section aria-labelledby="new-in-you" className="mb-6">
        <h2 id="new-in-you" className="flex items-center gap-2 text-label uppercase text-textMuted mb-2.5">
          <Sparkles size={14} strokeWidth={1.75} className="text-gold" /> New in YOU
        </h2>
        <div className="space-y-3">
          {WHATS_NEW.map(item => <NewCard key={item.id} item={item} />)}
        </div>
      </section>

      <section aria-labelledby="extras" className="mb-6">
        <h2 id="extras" className="flex items-center gap-2 text-label uppercase text-textMuted mb-1">
          <Puzzle size={14} strokeWidth={1.75} className="text-gold" /> Extras for your YOU
        </h2>
        <p className="text-caption text-textMuted mb-2.5">
          Optional parts you can add or take away whenever you like. New extras appear here. They're also in Your Own Universe, under Make YOU yours.
        </p>
        <div className="rounded-card bg-surface1 shadow-card px-4 py-2">
          {PLUGINS.map(p => <PluginRow key={p.key} plugin={p} onChange={on => setPlugin(p.key, on)} />)}
        </div>
      </section>

      <section aria-labelledby="suggest" className="rounded-card border border-dashed border-borderC bg-[color-mix(in_srgb,var(--surface-1)_60%,transparent)] p-4">
        <h2 id="suggest" className="flex items-center gap-2 font-serif text-h3 text-textPrimary m-0 mb-1">
          <Lightbulb size={18} strokeWidth={1.75} className="text-gold" /> Wish YOU did something?
        </h2>
        <p className="text-bodySm text-textSecondary m-0 mb-3">
          Suggest an idea for a new feature or extra. Every idea is read, and some of the best ones become the next thing on this page.
        </p>
        <button
          type="button"
          onClick={() => openFeedback?.("idea")}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium"
        >
          <Lightbulb size={16} strokeWidth={1.75} /> Suggest an idea
        </button>
      </section>
    </div>
  );
}
