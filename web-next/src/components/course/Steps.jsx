import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, LifeBuoy, Plus, Footprints, BookOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { SUPPORT_LINK } from "../../constants/questionnaires";
import { VALUE_LIBRARY, VALUE_ICONS } from "../../constants/valueLibrary";
import { Modal } from "../ui/Modal";
import { findInCodex, closestValues, displayWord, validWord, isCodexValue } from "../../lib/valueWords";

// The building blocks every course part and tool is made of. Each takes
// the step, its current value, and onChange. Kept plain and roomy: one
// thing per screen, big targets, words as well as colour for every state.

const FIELD = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";

function Prompt({ children, hint }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-hero text-textPrimary m-0">{children}</h2>
      {hint && <p className="text-bodySm text-textSecondary mt-2 mb-0">{hint}</p>}
    </div>
  );
}

function Paragraphs({ text, className = "" }) {
  return (
    <div className={`space-y-3.5 ${className}`}>
      {String(text).split("\n\n").map((p, i) => (
        <p key={i} className="m-0 whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}

function SupportLine() {
  return (
    <div className="text-caption text-textMuted mt-3 flex items-start gap-1.5">
      <LifeBuoy size={13} strokeWidth={1.75} className="flex-none mt-0.5" />
      <span>
        {SUPPORT_LINK.label}{" "}
        <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer" className="underline text-textSecondary">{SUPPORT_LINK.cta}</a>
      </span>
    </div>
  );
}

// ── read ──
function Read({ step }) {
  if (step.quote) {
    return (
      <div className="flex flex-col items-center text-center pt-10">
        <span aria-hidden="true" className="font-serif text-[64px] leading-none text-gold mb-2">“</span>
        <blockquote className="font-serif italic text-[26px] leading-snug text-textPrimary m-0 max-w-[420px]">{step.quote}</blockquote>
        <div className="text-caption text-textMuted mt-5">A message directly from YOU</div>
      </div>
    );
  }
  return (
    <div>
      {step.eyebrow && <div className="text-label uppercase text-gold mb-2">{step.eyebrow}</div>}
      {step.title && <h2 className="font-serif text-hero text-textPrimary mt-0 mb-4">{step.title}</h2>}
      {step.body && <Paragraphs text={step.body} className="text-[16px] leading-relaxed text-textPrimary" />}
    </div>
  );
}

// ── reflect ──
function Reflect({ step, value, onChange }) {
  return (
    <div>
      <Prompt hint={step.hint}>{step.prompt}</Prompt>
      <textarea
        rows={6}
        value={value || ""}
        placeholder={step.placeholder || ""}
        onChange={e => onChange(e.target.value)}
        aria-label={step.prompt}
        className={`${FIELD} text-[15px] leading-relaxed`}
      />
      {step.support && <SupportLine />}
    </div>
  );
}

// ── choose ──
function Choose({ step, value, onChange }) {
  const [other, setOther] = useState("");
  const picked = step.multi ? (value || []) : value;
  const isOn = opt => (step.multi ? picked.includes(opt) : picked === opt);
  const toggle = opt => {
    if (step.multi) onChange(isOn(opt) ? picked.filter(x => x !== opt) : [...picked, opt]);
    else onChange(isOn(opt) ? null : opt);
  };
  const extras = step.multi ? picked.filter(x => !step.options.includes(x)) : (picked && !step.options.includes(picked) ? [picked] : []);
  function addOther() {
    const t = other.trim();
    if (!t) return;
    if (step.multi) { if (!picked.includes(t)) onChange([...picked, t]); } else onChange(t);
    setOther("");
  }
  return (
    <div>
      <Prompt hint={step.hint || (step.multi ? "Choose any that fit." : null)}>{step.prompt}</Prompt>
      <div className="flex flex-wrap gap-2" role={step.multi ? "group" : "radiogroup"} aria-label={step.prompt}>
        {[...step.options, ...extras].map(opt => {
          const on = isOn(opt);
          return (
            <button
              key={opt}
              type="button"
              role={step.multi ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => toggle(opt)}
              className={`inline-flex items-center gap-1.5 text-body px-4 py-2.5 rounded-full border transition-colors duration-150 text-left ${
                on ? "bg-forestAccent border-forestAccent text-onAccent font-medium" : "bg-surface1 border-borderC text-textPrimary hover:border-forestAccent"
              }`}
            >
              {on && <Check size={15} strokeWidth={2.25} />}
              {opt}
            </button>
          );
        })}
      </div>
      {step.other && (
        <div className="flex gap-2 mt-4">
          <input
            value={other}
            onChange={e => setOther(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOther(); } }}
            placeholder="Something else…"
            aria-label="Add your own"
            className={`${FIELD} py-2.5`}
          />
          <button type="button" onClick={addOther} aria-label="Add" className="flex-none w-11 rounded-sm border border-borderC bg-surface1 text-textSecondary flex items-center justify-center hover:border-forestAccent">
            <Plus size={18} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── scenario ──
// Choose what you'd most likely do; then every option shows what it holds.
function Scenario({ step, value, onChange }) {
  const chosen = typeof value === "number" ? value : null;
  return (
    <div>
      <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
        <div className="text-label uppercase text-gold mb-1.5">{step.label}</div>
        <div className="font-serif text-h1 text-textPrimary leading-snug">{step.situation}</div>
      </div>
      <div className="text-bodySm text-textSecondary mb-3">What would you most likely do?</div>
      <div className="space-y-2.5" role="radiogroup" aria-label={step.situation}>
        {step.options.map((opt, i) => {
          const on = chosen === i;
          return (
            <div key={i}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(i)}
                className={`w-full text-left rounded-sm border px-4 py-3 text-body transition-colors duration-150 ${
                  on ? "border-forestAccent bg-surface1 text-textPrimary font-medium" : "border-borderC bg-surface2 text-textPrimary hover:border-forestAccent"
                }`}
              >
                <span className="flex items-start gap-2">
                  <span className={`mt-1 w-3.5 h-3.5 flex-none rounded-full border-2 ${on ? "border-forestAccent bg-forestAccent" : "border-textMuted"}`} aria-hidden="true" />
                  <span>{opt.text}</span>
                </span>
              </button>
              {chosen !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-bodySm pl-9 pr-2 pt-1.5 ${on ? "text-textPrimary" : "text-textMuted"}`}
                >
                  {on && <span className="text-label uppercase text-gold mr-1.5">Your choice</span>}
                  {opt.reflection}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── scale ──
function Scale({ step, value, onChange }) {
  const scores = value || {};
  return (
    <div>
      <Prompt hint="Tap the one that fits best.">{step.prompt}</Prompt>
      <div className="space-y-3">
        {step.statements.map(st => {
          const v = scores[st.key];
          return (
            <div key={st.key} className="rounded-card bg-surface1 shadow-card p-4">
              <div className="text-body text-textPrimary mb-3" id={`st-${st.key}`}>{st.text}</div>
              <div className="flex gap-1.5" role="radiogroup" aria-labelledby={`st-${st.key}`}>
                {step.scale.map((word, i) => {
                  const n = i + 1;
                  const on = v === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={word}
                      onClick={() => onChange(prev => ({ ...(prev || {}), [st.key]: n }))}
                      className={`flex-1 h-10 rounded-full border text-bodySm transition-colors duration-150 ${
                        on ? "bg-forestAccent border-forestAccent text-onAccent font-semibold" : v && n < v ? "bg-surface3 border-borderC text-textSecondary" : "bg-surface2 border-borderC text-textMuted hover:border-forestAccent"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-caption text-textMuted mt-1.5">
                <span>{step.scale[0]}</span>
                <span className={v ? "text-forestAccent font-medium" : ""}>{v ? step.scale[v - 1] : ""}</span>
                <span>{step.scale[step.scale.length - 1]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── breathe ──
// A circle that grows on the in-breath, rests, and softens on the out.
const PHASES = ["Breathe in", "Hold", "Breathe out"];
function Breathe({ step }) {
  const reduce = useReducedMotion();
  const [pattern] = useState(step.pattern || [4, 2, 6]);
  const [round, setRound] = useState(0); // 0 = not started
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(pattern[0]);
  const done = round > step.rounds;
  const timer = useRef(null);

  useEffect(() => {
    if (round === 0 || done) return;
    timer.current = setTimeout(() => {
      if (left > 1) { setLeft(l => l - 1); return; }
      let p = phase + 1;
      while (p < 3 && !pattern[p]) p++;
      if (p >= 3) { setRound(r => r + 1); setPhase(0); setLeft(pattern[0]); }
      else { setPhase(p); setLeft(pattern[p]); }
    }, 1000);
    return () => clearTimeout(timer.current);
  }, [round, phase, left, done, pattern]);

  const size = round === 0 || done ? 0.7 : phase === 0 ? 1 : phase === 1 ? 1 : 0.55;
  const dur = round === 0 || done ? 0.6 : pattern[phase];

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="font-serif text-hero text-textPrimary mt-0 mb-1">{step.title}</h2>
      <div className="text-bodySm text-textSecondary mb-6">
        {done ? "Well done. Notice how you feel." : round === 0 ? `${step.rounds} slow breaths, in through the nose if you can.` : `Breath ${round} of ${step.rounds}`}
      </div>
      <div className="relative w-[220px] h-[220px] flex items-center justify-center mb-6" aria-live="polite">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, var(--sage) 0%, var(--forest-accent) 60%, transparent 72%)" }}
          animate={reduce ? { opacity: 0.8 } : { scale: size, opacity: phase === 1 && round ? 0.95 : 0.8 }}
          transition={{ duration: dur, ease: "easeInOut" }}
        />
        <div className="relative text-onAccent font-serif text-h1 drop-shadow">
          {round === 0 ? "" : done ? "✓" : <>{PHASES[phase]}<div className="text-h2 opacity-80">{left}</div></>}
        </div>
      </div>
      {(round === 0 || done) && (
        <button
          type="button"
          onClick={() => { setRound(1); setPhase(0); setLeft(pattern[0]); }}
          className="text-body text-forestAccent font-medium border border-borderC bg-surface1 rounded-full px-5 py-2.5 hover:border-forestAccent"
        >
          {done ? "Breathe again" : "Begin breathing"}
        </button>
      )}
    </div>
  );
}

// ── list ──
function List({ step, value, onChange }) {
  const items = Array.from({ length: step.count }, (_, i) => (value || [])[i] || "");
  const set = (i, text) => {
    const next = [...items];
    next[i] = text;
    onChange(next);
  };
  const useExample = ex => {
    const i = items.findIndex(x => !x.trim());
    if (i !== -1) set(i, ex);
  };
  const unused = (step.examples || []).filter(ex => !items.includes(ex));
  return (
    <div>
      <Prompt hint={step.hint}>{step.prompt}</Prompt>
      <div className="space-y-2.5 mb-5">
        {items.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="font-serif text-h2 text-gold w-5 text-right flex-none pt-2.5">{i + 1}</span>
            <textarea
              rows={2}
              value={text}
              onChange={e => set(i, e.target.value)}
              aria-label={`Commitment ${i + 1}`}
              className={`${FIELD} py-2.5`}
            />
          </div>
        ))}
      </div>
      {unused.length > 0 && items.some(x => !x.trim()) && (
        <div>
          <div className="text-label uppercase text-textMuted mb-2">Tap to start from one</div>
          <div className="space-y-2">
            {unused.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => useExample(ex)}
                className="w-full text-left text-bodySm text-textSecondary italic border border-dashed border-borderC rounded-sm px-3.5 py-2.5 hover:border-forestAccent hover:text-textPrimary"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── value ──
// Which values a challenge honoured: any of the Seeker's active values, and
// any other from the Codex glossary. The answer is a list of names.
const ELEMENTS = ["Water", "Fire", "Earth", "Air", "Ether"];

function ValueChip({ name, on, onClick, note }) {
  const Icon = VALUE_ICONS[name];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-body px-4 py-2.5 rounded-full border transition-colors duration-150 ${
        on ? "bg-gold border-gold text-[#1A1F1D] font-medium" : "bg-surface1 border-borderC text-textPrimary hover:border-gold"
      }`}
    >
      {on ? <Check size={15} strokeWidth={2.25} /> : Icon ? <Icon size={15} strokeWidth={1.75} className="text-textMuted" /> : null}
      {name}
      {note && <span className={`text-caption ${on ? "text-[#1A1F1D]/70" : "text-textMuted"}`}>{note}</span>}
    </button>
  );
}

function Glossary({ open, onClose, picked, onToggle }) {
  const { values } = useAppData();
  const [q, setQ] = useState("");
  const held = Object.fromEntries(values.map(v => [v.name, v.status === "rested" ? "Resting" : "Active"]));
  const needle = q.trim().toLowerCase();
  const matches = VALUE_LIBRARY.filter(v => !needle
    || v.name.toLowerCase().includes(needle)
    || (v.essence || "").toLowerCase().includes(needle)
    || (v.synonyms || []).some(x => x.toLowerCase().includes(needle))
    || (v.subValues || []).some(x => x.toLowerCase().includes(needle)));
  // A word that isn't a Codex value's name: where it lives, what's close,
  // and the choice to keep it as the Seeker's own.
  const home = needle ? findInCodex(q) : null;
  const exact = home?.via === "name";
  const close = needle && !exact ? closestValues(q).filter(v => v.name !== home?.value.name) : [];
  const word = displayWord(q);
  const canKeep = needle && !exact && validWord(q) && !picked.includes(word);
  function keepOwn() {
    onToggle(word);
    setQ("");
  }
  return (
    <Modal open={open} onClose={onClose} title="All values">
      <div className="text-bodySm text-textSecondary mb-3">Choose any that this challenge honoured, or type one in your own words. Values you hold grow; others are kept with the challenge.</div>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search, or type your own…"
        aria-label="Search values"
        className={`${FIELD} py-2.5 mb-4`}
      />
      {needle && !exact && (
        <div className="rounded-card bg-surface1 border border-borderC p-4 mb-4">
          {home && (
            <div className="mb-3">
              <div className="text-bodySm text-textPrimary mb-2">
                "{word}" lives in the Codex as {home.via === "synonym" ? "another word for" : "part of"} <span className="font-medium">{home.value.name}</span>.
              </div>
              <ValueChip name={home.value.name} on={picked.includes(home.value.name)} onClick={() => onToggle(home.value.name)} />
            </div>
          )}
          {close.length > 0 && (
            <div className="mb-3">
              <div className="text-label uppercase tracking-[0.12em] text-textMuted mb-2">{home ? "Also close" : "Closest in the Codex"}</div>
              <div className="flex flex-wrap gap-2">
                {close.map(v => <ValueChip key={v.name} name={v.name} on={picked.includes(v.name)} onClick={() => onToggle(v.name)} />)}
              </div>
            </div>
          )}
          {canKeep ? (
            <button type="button" onClick={keepOwn} className="w-full text-left rounded-sm border border-dashed border-gold px-3.5 py-3 hover:bg-surface2">
              <span className="block text-body text-textPrimary font-medium">Keep "{word}" as your own word</span>
              <span className="block text-caption text-textMuted mt-0.5">Saved with this challenge. It isn't in the Codex yet, so it won't grow on its own until you make it one of your values.</span>
            </button>
          ) : picked.includes(word) ? (
            <div className="text-bodySm text-forestAccent">"{word}" is chosen, as your own word.</div>
          ) : needle && !validWord(q) ? (
            <div className="text-caption text-textMuted">An own word can be 2 to 30 letters, with spaces or hyphens.</div>
          ) : null}
        </div>
      )}
      {ELEMENTS.map(el => {
        const list = matches.filter(v => v.element === el);
        if (!list.length) return null;
        return (
          <div key={el} className="mb-4">
            <div className="text-label uppercase tracking-[0.12em] text-gold mb-1.5">{el}</div>
            {list.map(v => {
              const on = picked.includes(v.name);
              const Icon = VALUE_ICONS[v.name];
              return (
                <button
                  key={v.name}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => onToggle(v.name)}
                  className={`w-full flex items-start gap-3 text-left rounded-sm px-3 py-2.5 mb-1 border transition-colors duration-150 ${on ? "border-gold bg-surface1" : "border-transparent hover:bg-surface1"}`}
                >
                  <span className={`w-8 h-8 flex-none rounded-full flex items-center justify-center ${on ? "bg-gold text-[#1A1F1D]" : "bg-surface3 text-textSecondary"}`}>
                    {on ? <Check size={15} strokeWidth={2.5} /> : Icon ? <Icon size={15} strokeWidth={1.75} /> : null}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-body text-textPrimary font-medium">{v.name}</span>
                      {held[v.name] && <span className="text-caption text-forestAccent">{held[v.name]}</span>}
                    </span>
                    <span className="block text-caption text-textMuted">{v.essence}</span>
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-surface2 pt-2">
        <button type="button" onClick={onClose} className="w-full min-h-[48px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest">
          Done{picked.length ? ` · ${picked.length} chosen` : ""}
        </button>
      </div>
    </Modal>
  );
}

function Value({ step, value, onChange }) {
  const { activeValues } = useAppData();
  const [glossary, setGlossary] = useState(false);
  const picked = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = name => onChange(prev => {
    const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
    return list.includes(name) ? list.filter(x => x !== name) : [...list, name];
  });
  const activeNames = activeValues.map(v => v.name);
  const others = picked.filter(n => !activeNames.includes(n));
  return (
    <div>
      <Prompt hint={step.hint}>{step.prompt}</Prompt>
      {activeNames.length > 0 && <div className="text-label uppercase tracking-[0.12em] text-textMuted mb-2">Your values</div>}
      <div className="flex flex-wrap gap-2" role="group" aria-label={step.prompt}>
        {activeNames.map(name => <ValueChip key={name} name={name} on={picked.includes(name)} onClick={() => toggle(name)} />)}
        {others.map(name => <ValueChip key={name} name={name} on onClick={() => toggle(name)} note={isCodexValue(name) ? null : "your word"} />)}
      </div>
      <button
        type="button"
        onClick={() => setGlossary(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-body text-forestAccent font-medium border border-dashed border-borderC rounded-full px-4 py-2.5 hover:border-forestAccent"
      >
        <BookOpen size={16} strokeWidth={1.75} /> Choose from all values
      </button>
      <div className="text-caption text-textMuted mt-3">Choose as many as fit, or none at all.</div>
      <Glossary open={glossary} onClose={() => setGlossary(false)} picked={picked} onToggle={toggle} />
    </div>
  );
}

// ── challenge ──
// The challenge itself. Its own buttons: live it now, or carry it.
function Challenge({ step, onLived, onCarry }) {
  return (
    <div className="flex flex-col items-center text-center pt-4">
      <div className="w-14 h-14 rounded-full bg-surface3 text-gold flex items-center justify-center mb-4">
        <Footprints size={24} strokeWidth={1.75} />
      </div>
      <div className="text-label uppercase text-gold mb-2">Your challenge</div>
      <h2 className="font-serif text-hero text-textPrimary mt-0 mb-4">{step.title}</h2>
      <Paragraphs text={step.body} className="text-[16px] leading-relaxed text-textPrimary text-left max-w-[440px] mb-8" />
      <div className="w-full max-w-[360px] space-y-2.5">
        <button type="button" onClick={onLived} className="w-full min-h-[52px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest">
          I've lived it
        </button>
        <button type="button" onClick={onCarry} className="w-full min-h-[48px] rounded-sm border border-borderC bg-surface1 text-textPrimary text-body hover:bg-surface3">
          Carry it with me for now
        </button>
      </div>
      <div className="text-caption text-textMuted mt-3 max-w-[320px]">There's no hurry. It waits on your path until you've tried it.</div>
    </div>
  );
}

export const STEP_COMPONENTS = { read: Read, reflect: Reflect, choose: Choose, scenario: Scenario, scale: Scale, breathe: Breathe, list: List, value: Value, challenge: Challenge };

// Can the Seeker move on from this step?
export function stepReady(step, value) {
  if (step.type === "scale") return step.statements.every(st => value?.[st.key]);
  if (step.type === "scenario") return typeof value === "number";
  return true;
}

// Has anything been written or chosen?
export function stepAnswered(step, value) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.some(x => String(x).trim());
  if (typeof value === "string") return Boolean(value.trim());
  return true;
}
