import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, Pencil, Sparkles } from "lucide-react";
import { SegmentedControl } from "../ui/SegmentedControl";
import { PILLAR_ICONS } from "../../constants/pillarIcons";
import { LEVELS as LEVELS_FOR_PATH } from "../../constants/app.const";
import { CHARACTERS, COMPANION_FORMS, REALM_ART } from "../../lib/rpg";
import { DECOR, SLOTS, styleById } from "../../lib/realmCatalog";
import RealmScene from "./RealmScene";
import { CatalogSheet, SlotRow } from "./RealmCatalog";
import "../../styles/realm.css";

// The Realm (Cassidy, Nov 1, after her concept art): YOU as a life game in
// place of the Pillars and Values sections. It opens on your scene: your
// Sanctuary, your character and your companion. Every place on them is a
// slot; each Pillar level opens a tier of its catalog, one piece in every
// style, and you choose and buy what you like, Sims-style.
//
// `realm` is lib/rpg's useRealm() (or the preview's sample); `quests` and
// `values` are whole panels so the preview can stand alone.
const TABS = [
  { value: "wardrobe", label: "Wardrobe" },
  { value: "companion", label: "Companion" },
  { value: "sanctuary", label: "Sanctuary" },
  { value: "quests", label: "Quests" },
  { value: "values", label: "Values" },
  { value: "stats", label: "Stats" }
];

export default function Realm({ realm, fallbackName, quests, values, onFreeDream }) {
  const [tab, setTab] = useState("wardrobe");
  const [choosing, setChoosing] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 3200);
    return () => clearTimeout(t);
  }, [note]);

  if (!realm.character || choosing) {
    return (
      <div className="realm">
        <CharacterSelect
          current={realm.character?.id}
          name={realm.heroName || fallbackName || ""}
          onCancel={realm.character ? () => setChoosing(false) : null}
          onChoose={async (id, name) => {
            try { await realm.chooseCharacter(id, name); setChoosing(false); }
            catch (e) { console.error("[Realm] choose failed:", e); setNote("That didn't save. Check your connection and try again."); }
          }}
        />
        <Toast note={note} />
      </div>
    );
  }

  const freshIn = group => SLOTS.filter(s => s.group === group && realm.fresh[s.id]).length;
  const tabs = TABS.map(t => {
    const n = ["wardrobe", "companion", "sanctuary"].includes(t.value) ? freshIn(t.value) : 0;
    return n ? { ...t, label: `${t.label} ${n}` } : t;
  });
  const name = realm.heroName || fallbackName || "Seeker";
  const rows = group => SLOTS.filter(s => s.group === group).map(s => (
    <SlotRow key={s.id} realm={realm} slotId={s.id} onOpen={() => setSheet(s.id)} />
  ));

  return (
    <div className="realm">
      <Hero realm={realm} name={name} onCustomise={() => setChoosing(true)} onOpenSlot={setSheet} />
      <div className="mt-3 mb-3">
        <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "wardrobe" && (
        <div className="space-y-2">
          <p className="text-caption text-textMuted px-1">Each Pillar's level opens new pieces in every style. Tap one to browse.</p>
          {rows("wardrobe")}
        </div>
      )}
      {tab === "companion" && (
        <div className="space-y-2">
          <Companion realm={realm} onNote={setNote} />
          {rows("companion")}
        </div>
      )}
      {tab === "sanctuary" && (
        <div className="space-y-2">
          <div className="realm-frame p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="realm-title text-[20px]">Your Sanctuary · Lv. {realm.sanctuaryLevel}</div>
              <div className="text-caption text-textMuted">
                {realm.fullSet ? `A full ${styleById(realm.fullSet).name} set. It all belongs together.` : "Put all four places in one style for a full set."}
              </div>
            </div>
          </div>
          {rows("sanctuary")}
          <div className="realm-title text-[18px] pt-2 px-1">Decor</div>
          {DECOR.map(d => <SlotRow key={d.id} realm={realm} slotId={d.id} onOpen={() => setSheet(d.id)} />)}
        </div>
      )}
      {tab === "quests" && (typeof quests === "function" ? quests({ openTab: setTab }) : quests)}
      {tab === "values" && <div className="realm-frame p-3">{values}</div>}
      {tab === "stats" && (
        <div className="space-y-3">
          <Evolution realm={realm} />
          <PillarList realm={realm} onFreeDream={onFreeDream} />
        </div>
      )}

      {sheet && (
        <CatalogSheet
          realm={realm}
          slotId={sheet}
          onClose={() => setSheet(null)}
          onBought={el => floatFrom(el, "✦ Yours")}
          onNote={setNote}
        />
      )}
      <Toast note={note} />
    </div>
  );
}

function Toast({ note }) {
  return (
    <AnimatePresence>
      {note && (
        <motion.div
          key={note}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 max-w-[90vw] rounded-[12px] border border-[#DDB76A] bg-[#2A1A3C] text-[#F4EAD8] text-bodySm px-4 py-2.5 shadow-card text-center"
        >
          {note}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function floatFrom(el, text) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement("div");
  f.className = "realm-float";
  f.textContent = text;
  f.style.left = `${r.left + r.width / 2 - 30}px`;
  f.style.top = `${r.top - 6}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}

function Motes({ count = 14 }) {
  return (
    <div className="realm-motes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} style={{ left: `${(i * 53) % 100}%`, top: `${45 + ((i * 37) % 55)}%`, animationDelay: `${-(i * 0.47).toFixed(2)}s`, animationDuration: `${5 + (i % 5)}s` }} />
      ))}
    </div>
  );
}

// The character, their level and rank, and what's in their purse.
// The opening scene, with who you are and what's in your purse over it.
function Hero({ realm, name, onCustomise, onOpenSlot }) {
  const { rank, totalXP } = realm;
  const next = rank.next;
  const pct = next ? ((totalXP - rank.xp) / (next.xp - rank.xp)) * 100 : 100;
  return (
    <div className="realm-frame gem p-2">
      <RealmScene realm={realm} onOpenSlot={onOpenSlot}>
        <Motes />
        <div className="realm-hud top flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="realm-title text-[26px] leading-none truncate">{name}</div>
            <div className="realm-title text-[15px] text-[#E8D9F4]">{realm.character.name} · {rank.name}</div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-none">
            <span className="realm-title text-[17px] font-bold rounded-full border border-[#DDB76A] bg-[#2A1A3C]/90 px-2.5">Lv. {realm.level}</span>
            <span className="flex gap-1.5">
              <Purse icon={<i className="realm-coin" />} value={realm.coins} label="YOU Coins" />
              <Purse icon={<i className="realm-crystal" />} value={realm.crystals} label="Crystals" />
            </span>
          </div>
        </div>
        <div className="realm-hud bottom">
          <div className="flex items-center gap-2">
            <div className="realm-xp flex-1"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
            <button type="button" onClick={onCustomise} className="realm-btn small flex-none" aria-label="Change your character">
              <Pencil size={13} aria-hidden="true" />Character
            </button>
          </div>
          <div className="flex justify-between text-[11px] text-[#D3C3E0] mt-1 tabular-nums">
            <span>{totalXP.toLocaleString()} XP</span>
            <span>{next ? `${(next.xp - totalXP).toLocaleString()} to ${next.name}` : "Every rank reached"}</span>
          </div>
        </div>
      </RealmScene>
    </div>
  );
}

function Purse({ icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[var(--realm-line)] bg-black/25 px-3 py-1" title={label}>
      {icon}
      <span className="realm-title text-[19px] tabular-nums leading-none">{value.toLocaleString()}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Seedling to Elder: the character's evolutions.
function Evolution({ realm }) {
  return (
    <div className="realm-frame p-3">
      <div className="realm-title text-[20px]">Evolution path · <span className="realm-gold">{realm.rank.name}</span></div>
      <div className="realm-evo mt-1">
        {LEVELS_FOR_PATH.map((l, i) => {
          const state = i === realm.rank.index ? "now" : i > realm.rank.index ? "lock" : "";
          return (
            <div key={l.name} className={`${state} flex flex-col items-center gap-1 min-w-[64px] text-center`}>
              <div className="ring" style={{ backgroundImage: `url(${realm.character.art})` }}>
                {state === "lock" && <Lock size={16} className="absolute inset-0 m-auto text-[#F4EAD8]" aria-hidden="true" />}
              </div>
              <span className="realm-title text-[14px] leading-tight">{l.name}</span>
              <span className="text-[10.5px] text-textMuted">{l.xp.toLocaleString()} XP</span>
            </div>
          );
        })}
      </div>
      <p className="text-caption text-textMuted mt-1">{realm.rank.desc}</p>
    </div>
  );
}

// One Pillar's upgrades: five tiles from where you start to Flourish.
function PillarList({ realm, onFreeDream }) {
  const quietest = [...realm.pillars].sort((a, b) => (a.xp || 0) - (b.xp || 0))[0];
  return (
    <div className="realm-frame p-3">
      <div className="flex items-center justify-between">
        <div className="realm-title text-[20px]">Pillars</div>
        <span className="text-caption text-textMuted">Harmony {realm.harmony}%</span>
      </div>
      <div className="mt-2 space-y-2">
        {realm.pillars.map(p => {
          const Icon = PILLAR_ICONS[p.name];
          return (
            <div key={p.name} className="grid grid-cols-[22px_96px_1fr_40px] gap-2 items-center">
              <span style={{ color: p.color }}>{Icon && <Icon size={17} strokeWidth={1.75} />}</span>
              <span className="realm-title text-[16px] truncate">{p.name}</span>
              <span className="h-[7px] rounded-full bg-black/40 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}99, ${p.color})` }} /></span>
              <span className="realm-title text-[16px] text-right tabular-nums">Lv. {p.level}</span>
            </div>
          );
        })}
      </div>
      <p className="text-caption text-textMuted mt-3 pt-2.5 border-t border-[var(--realm-line)]">
        Harmony is how close your quietest Pillar is to your strongest.
        {realm.harmony < 100 && quietest ? <> Your quietest right now is <span className="text-textPrimary">{quietest.name}</span>.</> : null}
      </p>
      {onFreeDream && (
        <div className="mt-3">
          <div className="text-caption text-textMuted mb-1.5">Free a dream in…</div>
          <div className="flex flex-wrap gap-1.5">
            {realm.pillars.map(p => (
              <button key={p.name} type="button" onClick={() => onFreeDream(p.name)} className="realm-chip inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Companion({ realm, onNote }) {
  const [name, setName] = useState(realm.companionName);
  const form = COMPANION_FORMS[realm.companionForm];
  const next = COMPANION_FORMS[realm.companionForm + 1];
  const canEvolve = next && realm.heartLevel >= next.heart && realm.crystals >= next.crystals;
  async function evolve(e) {
    const el = e.currentTarget;
    try {
      if (await realm.evolveCompanion()) { floatFrom(el, "✦ Evolved"); onNote(`${realm.companionName} became a ${next.name}.`); }
    } catch (err) {
      console.error("[Realm] evolve failed:", err);
      onNote("That didn't save. Check your connection and try again.");
    }
  }
  return (
    <div className="realm-frame gem p-3">
      <div className="realm-painting aspect-[307/110]" style={{ backgroundImage: `url(${REALM_ART.companion})`, backgroundPosition: "center 30%" }}>
        <Motes count={8} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <label htmlFor="realm-companion-name" className="sr-only">Your companion's name</label>
        <input
          id="realm-companion-name"
          value={name}
          maxLength={24}
          onChange={e => setName(e.target.value)}
          onBlur={() => { const n = name.trim(); if (n && n !== realm.companionName) realm.nameCompanion(n).catch(err => console.error("[Realm] name failed:", err)); }}
          className="realm-title text-[24px] bg-transparent border-b border-dashed border-[var(--realm-line)] min-w-0 flex-1 focus:outline-none focus:border-[#DDB76A]"
        />
        <span className="realm-title text-[16px] flex-none text-textMuted">{form.name}</span>
      </div>
      <p className="text-caption text-textMuted mt-1">Your companion grows with your Heart. Evolving takes Crystals, which you earn every time a Pillar levels up.</p>
      <ol className="mt-2.5 space-y-1.5">
        {COMPANION_FORMS.map((f, i) => {
          const done = i <= realm.companionForm;
          return (
            <li key={f.name} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 ${done ? "border-[#DDB76A] bg-black/20" : "border-[var(--realm-line)]"}`}>
              <span className="realm-title text-[17px] flex-1">{f.name}</span>
              {done ? (
                <span className="text-[11.5px] text-[#7FCF8E] inline-flex items-center gap-1"><Check size={12} aria-hidden="true" />{i === realm.companionForm ? "Now" : "Grown"}</span>
              ) : i === realm.companionForm + 1 ? (
                <button type="button" onClick={evolve} disabled={!canEvolve} className="realm-btn small">
                  <i className="realm-crystal" />{f.crystals} · Heart {f.heart}
                </button>
              ) : (
                <span className="text-[11.5px] text-textMuted">Heart {f.heart} · {f.crystals} Crystals</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Who do you want to be? Shown the first time, and from Customise.
function CharacterSelect({ current, name: startName, onChoose, onCancel }) {
  const [pick, setPick] = useState(current || CHARACTERS[0].id);
  const [name, setName] = useState(startName);
  const [busy, setBusy] = useState(false);
  const chosen = CHARACTERS.find(c => c.id === pick);
  return (
    <div>
      <div className="text-center px-2 pt-2">
        <Sparkles size={22} className="mx-auto realm-gold" aria-hidden="true" />
        <div className="realm-title text-[30px] leading-tight mt-1">Choose who you'll become</div>
        <p className="text-bodySm text-textSecondary mt-1">Everything you do in YOU will grow this character, their companion and their home.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4" role="radiogroup" aria-label="Characters">
        {CHARACTERS.map(c => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={pick === c.id}
            aria-pressed={pick === c.id}
            onClick={() => setPick(c.id)}
            className="realm-pick"
            style={{ backgroundImage: `url(${c.art})` }}
          >
            <span>
              <span className="block realm-title text-[18px] leading-tight text-[#F4EAD8]">{c.name}</span>
              <span className="block text-[11px] leading-snug text-[#D3C3E0] mt-0.5">{c.line}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="realm-frame gem p-3.5 mt-4">
        <label htmlFor="realm-hero-name" className="text-[11px] uppercase tracking-[0.12em] text-textMuted">Your character's name</label>
        <input
          id="realm-hero-name"
          value={name}
          maxLength={24}
          onChange={e => setName(e.target.value)}
          placeholder="Name them"
          className="realm-title text-[24px] w-full bg-transparent border-b border-dashed border-[var(--realm-line)] focus:outline-none focus:border-[#DDB76A] mt-1"
        />
        <div className="flex gap-2 justify-end mt-3.5">
          {onCancel && <button type="button" onClick={onCancel} className="realm-btn small" style={{ background: "transparent" }}>Keep my character</button>}
          <button
            type="button"
            disabled={busy}
            onClick={async () => { setBusy(true); await onChoose(pick, name.trim()); setBusy(false); }}
            className="realm-btn solid"
          >
            Begin as {chosen.name}
          </button>
        </div>
        {onCancel && <p className="text-[11.5px] text-textMuted mt-2">Changing character keeps everything you've earned and bought.</p>}
      </div>
    </div>
  );
}
