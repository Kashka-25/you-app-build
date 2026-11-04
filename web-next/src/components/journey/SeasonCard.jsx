import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { AiButton, AiCard } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";
import { Guide } from "../ui/Guide";
import { latestReview, niceRange, useHemisphere } from "../../lib/seasons";
import { localDateKey } from "../../lib/week";
import SeasonReading from "./SeasonReading";
import SuggestChaptersPanel from "./SuggestChaptersPanel";

const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateKey(d);
};

// The stretches to read (Cassidy, Nov 2: "a drop down that offers the
// choices of time"). The ten weeks is the season you're in; the others
// were Look back.
const SPANS = [
  { key: "season", label: "The last ten weeks (your season)" },
  { key: "2w", label: "The last two weeks", from: () => daysAgo(14) },
  { key: "1m", label: "The last month", from: () => daysAgo(30) },
  { key: "3m", label: "The last three months", from: () => daysAgo(91) },
  { key: "date", label: "Since a date I choose" }
];

// The AI readings of your story, in one gold card with three tabs (Cassidy,
// Nov 4): Your season (the feel of a stretch of time), Chapters (the big
// eras of your life) and the latest Season review. Each tab says what it
// does right under the tabs, before anything uses an AI read.
// Folded into one gold bar (Cassidy, Nov 4: "one drop down tab… openable
// and retractable with a click"), so Memories lead the page. Closed to
// start; this device remembers if it was left open.
const OPEN_KEY = "you.story-readings-open";

// The house gold, kept bright for short words: the full gradient's darker
// ends swallow a label of a word or two.
const BRIGHT_GOLD = { backgroundImage: "linear-gradient(100deg, var(--ai-gold-2) 0%, var(--ai-gold-1) 50%, var(--ai-gold-2) 100%)", backgroundSize: "100% 100%" };

export default function SeasonCard() {
  const { hemisphere } = useHemisphere();
  const review = latestReview(hemisphere);
  // A link can open it straight to a tab: state { open: "season" | "chapters" | "review" }.
  const location = useLocation();
  const asked = location.state?.open;
  const [tab, setTab] = useState(asked || "season");
  const [expanded, setExpanded] = useState(() => {
    if (asked) return true;
    try { return localStorage.getItem(OPEN_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    if (!asked) return;
    setTab(asked);
    setExpanded(true);
  }, [location.key]);
  function toggle() {
    setExpanded(o => {
      try { localStorage.setItem(OPEN_KEY, o ? "0" : "1"); } catch { /* ignore */ }
      return !o;
    });
  }
  const tabs = [
    { key: "season", label: "Your season" },
    { key: "chapters", label: "Your chapters" },
    { key: "review", label: review.title.replace(/^Your /, "") }
  ];

  function onTabKey(e, i) {
    const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : null;
    if (next == null) return;
    e.preventDefault();
    setTab(tabs[next].key);
    document.getElementById(`story-tab-${tabs[next].key}`)?.focus();
  }

  return (
    <AiCard className="mb-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls="story-readings"
        className="w-full flex items-center gap-3 text-left -my-1 py-1"
      >
        <Sparkles size={20} strokeWidth={1.5} className="flex-none text-[var(--ai-gold-1)]" aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-h3 ai-gold-text" style={BRIGHT_GOLD}>Read between the lines</span>
          <span className="block text-caption text-[var(--ai-text-3)]">Your season, your chapters, your reviews</span>
        </span>
        <ChevronDown size={20} strokeWidth={1.75} className={`flex-none text-[var(--ai-gold-1)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {expanded && (
      <div id="story-readings" className="mt-4">
      <div role="tablist" aria-label="Readings of your story" className="flex gap-1 p-1 mb-2 rounded-full bg-white/5 border border-white/10">
        {tabs.map((t, i) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              id={`story-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`story-panel-${t.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={e => onTabKey(e, i)}
              className={`flex-1 min-w-0 min-h-[36px] px-2 rounded-full text-caption sm:text-bodySm truncate border transition-[opacity,background-color,border-color] ${on ? "bg-white/10 border-[color-mix(in_srgb,var(--ai-gold-2)_70%,transparent)] font-medium" : "border-transparent opacity-80 hover:opacity-100"}`}
            >
              {/* Gold lettering says "AI" (Cassidy, Nov 4). */}
              <span className="ai-gold-text" style={BRIGHT_GOLD}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div id={`story-panel-${tab}`} role="tabpanel" aria-labelledby={`story-tab-${tab}`} className="min-w-0">
        {tab === "season" && <SeasonTab />}
        {tab === "chapters" && <ChaptersTab />}
        {tab === "review" && <ReviewTab review={review} />}
      </div>
      </div>
      )}
    </AiCard>
  );
}

// Your season: choose a stretch of time, read it, and the reading opens
// full screen. On closing it you keep it (it joins your Memories by date),
// change the time, or delete it. Read only when asked, with AI consent,
// and always saying what it read from.
function SeasonTab() {
  const { currentSeason, readSeason } = useAppData();
  const [span, setSpan] = useState("season");
  const [since, setSince] = useState("");
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(null); // { reading, fresh }

  async function read() {
    const choice = SPANS.find(s => s.key === span);
    let opts = {};
    if (span === "date") {
      if (!since) return setMessage("Choose a date first.");
      opts = { from: since, to: daysAgo(-1), kind: "lookback", title: `Since ${since}` };
    } else if (choice.from) {
      opts = { from: choice.from(), to: daysAgo(-1), kind: "lookback", title: choice.label.replace(/^The /, "") };
    }
    setReading(true);
    setMessage("");
    try {
      const res = await readSeason(opts);
      if (res?.empty) setMessage(res.message);
      else setOpen({ reading: res.season, fresh: true });
    } catch (e) {
      console.error("[SeasonCard] readSeason failed:", e);
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "That stretch couldn't be read just now. Try again later.");
    }
    setReading(false);
  }

  return (
    <>
      <Guide label="What does this do?">
        Choose a stretch of time and YOU reads how it felt. You get a name for the season you've been in (like "Season of Slow Roots"), a few lines about it, and what stood out. It reads your weekly harvests, YOUrnal and Moments; your values and mood add a little colour.
        <span className="block mt-1.5">The reading opens full screen. When you close it, keep it in your Memories, read a different stretch, or delete it. Each reading uses one AI read.</span>
      </Guide>

      {currentSeason && (
        <button type="button" onClick={() => setOpen({ reading: currentSeason, fresh: false })} className="block w-full text-left mt-2">
          <span className="block text-caption text-[var(--ai-text-3)]">Your season now</span>
          <span className="block font-serif text-h2 ai-gold-text">{currentSeason.name}</span>
          <span className="inline-flex items-center gap-1 text-caption text-[var(--ai-text-2)] mt-0.5">
            Open the reading <ChevronRight size={14} strokeWidth={1.75} />
          </span>
        </button>
      )}

      <div className="text-caption text-[var(--ai-text-2)] mt-3 mb-1" id="season-span-label">Read</div>
      <SpanMenu value={span} onChange={v => { setSpan(v); setMessage(""); }} />
      {span === "date" && (
        <input
          type="date"
          value={since}
          max={localDateKey()}
          onChange={e => setSince(e.target.value)}
          aria-label="Read since"
          style={{ colorScheme: "dark" }}
          className="mt-2 w-full min-h-[44px] px-3 rounded-sm bg-white/10 border border-white/15 text-bodySm text-[var(--ai-text)]"
        />
      )}
      <AiButton size="sm" onClick={read} busy={reading} className="mt-3">
        {reading ? "Reading…" : "Read it"}
      </AiButton>
      {message && <div className="text-caption text-[var(--ai-text-2)] mt-2">{message}</div>}
      <DrawsFrom uses={["harvests", "journal", "moments", "values", "mood"]} className="mt-2" />

      <SeasonReading
        reading={open?.reading || null}
        fresh={Boolean(open?.fresh)}
        onClose={() => setOpen(null)}
        onChange={() => {
          setOpen(null);
          document.getElementById("season-span")?.focus();
        }}
      />
    </>
  );
}

function ChaptersTab() {
  const { moments } = useAppData();
  return (
    <>
      <Guide label="What does this do?">
        YOU reads your whole story so far, mainly your Memories, with your YOUrnal, harvest notes and pursuits for context. It suggests 2 to 5 chapters: the big eras of your life, each with a name, dates and a few words. Chapters you keep mark your Memories below.
        <span className="block mt-1.5">Nothing is saved until you choose to keep them. It uses one AI read.</span>
      </Guide>
      {moments.length > 0 ? (
        <SuggestChaptersPanel />
      ) : (
        <p className="text-bodySm text-[var(--ai-text-2)] m-0 mt-2">Add a few memories first: chapters are found in them.</p>
      )}
    </>
  );
}

// The latest Season review, now a tab of its own (Cassidy, Nov 4).
function ReviewTab({ review }) {
  return (
    <>
      <Guide label="What does this do?">
        At each solstice and equinox, YOU invites you to look back on the season that's ending (six months at an equinox). It's a short story to tap through: what you lived, how you felt and what grew. At the end, YOU can read it for you.
        <span className="block mt-1.5">Looking through is free. The reading at the end uses one AI read and is kept in your Memories.</span>
      </Guide>
      <div className="mt-2">
        <div className="font-serif text-h2 ai-gold-text">{review.title}</div>
        <div className="text-caption text-[var(--ai-text-3)]">{niceRange(review.from, review.to)} · {review.subtitle}</div>
      </div>
      <Link
        to="/season-review"
        className="mt-3 inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full border border-[color-mix(in_srgb,var(--ai-gold-2)_60%,transparent)] bg-white/5 hover:bg-white/10 text-bodySm text-[var(--ai-gold-1)]"
      >
        <Sparkles size={15} strokeWidth={1.75} aria-hidden="true" /> Open the review <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </>
  );
}

// The time choices in YOU's own look (Cassidy, Nov 4): a gold-edged menu
// on the night ink, instead of the phone's plain system list. Arrow keys,
// Enter and Escape work as in a native select.
function SpanMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => SPANS.findIndex(s => s.key === value));
  const wrap = useRef(null);
  const list = useRef(null);
  const current = SPANS.find(s => s.key === value) || SPANS[0];

  useEffect(() => {
    if (!open) return;
    setActive(SPANS.findIndex(s => s.key === value));
    list.current?.focus();
    const away = e => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function choose(i) {
    onChange(SPANS[i].key);
    setOpen(false);
    document.getElementById("season-span")?.focus();
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(SPANS.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(SPANS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); if (e.key === "Escape") document.getElementById("season-span")?.focus(); }
  }

  return (
    <div ref={wrap} className="relative">
      <button
        id="season-span"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="season-span-label season-span"
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); } }}
        className={`w-full flex items-center gap-2 min-h-[44px] pl-3 pr-3 rounded-sm text-left text-bodySm text-[var(--ai-text)] bg-white/10 border transition-colors ${open ? "border-[var(--ai-gold-2)]" : "border-white/15 hover:border-white/30"}`}
      >
        <span className="flex-1 min-w-0 truncate">{current.label}</span>
        <ChevronDown size={16} strokeWidth={1.75} className={`flex-none text-[var(--ai-gold-1)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-labelledby="season-span-label"
          aria-activedescendant={`season-span-${SPANS[active]?.key}`}
          onKeyDown={onKey}
          className="ai-card absolute left-0 right-0 top-full mt-1.5 z-20 rounded-sm p-1.5 m-0 list-none outline-none"
        >
          {SPANS.map((s, i) => {
            const selected = s.key === value;
            return (
              <li
                key={s.key}
                id={`season-span-${s.key}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex items-center gap-2.5 min-h-[44px] px-3 rounded-[10px] cursor-pointer text-bodySm transition-colors ${i === active ? "bg-white/10" : ""} ${selected ? "text-[var(--ai-gold-1)] font-medium" : "text-[var(--ai-text)]"}`}
              >
                <span className="w-4 flex-none">{selected && <Check size={16} strokeWidth={2} aria-hidden="true" />}</span>
                <span className="flex-1">{s.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
