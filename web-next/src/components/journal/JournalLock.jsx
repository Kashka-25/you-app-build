import { useCallback, useEffect, useState } from "react";
import { Delete, Lock } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { closeNow, isOpen, lockIsSet, markOpen, pinMatches, removeLock, setLock } from "../../lib/journalLock";

const PIN_MIN = 4;
const PIN_MAX = 6;
// After this many wrong tries, a short wait before the next.
const TRIES = 5;
const WAIT_MS = 30 * 1000;

// Whether YOUrnal is behind its lock right now, kept fresh while it's open:
// stepping away from YOU for a couple of minutes locks it again.
export function useJournalLock() {
  const { userId } = useAuth();
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump(n => n + 1), []);
  const set = lockIsSet(userId);
  const locked = set && !isOpen(userId);

  useEffect(() => {
    if (!set || locked) return;
    const keep = () => { if (document.visibilityState === "visible") markOpen(userId); };
    const back = () => { if (document.visibilityState === "visible") refresh(); };
    keep();
    const t = setInterval(keep, 30 * 1000);
    document.addEventListener("visibilitychange", back);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", back); };
  }, [set, locked, userId, refresh]);

  return { userId, isSet: set, locked, refresh };
}

// The number pad and the dots, shared by unlocking and setting a PIN.
function PinPad({ value, onChange, onDone, disabled }) {
  const press = d => {
    if (disabled || value.length >= PIN_MAX) return;
    const next = value + d;
    onChange(next);
    if (next.length === PIN_MAX) onDone?.(next);
  };
  useEffect(() => {
    const onKey = e => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") onChange(value.slice(0, -1));
      else if (e.key === "Enter" && value.length >= PIN_MIN) onDone?.(value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const key = "h-14 rounded-full bg-surface1 border border-borderC text-[21px] font-sans tabular-nums text-textPrimary active:scale-95 transition disabled:opacity-40";
  return (
    <div className="w-full max-w-[260px] mx-auto">
      <div className="flex justify-center gap-3 mb-5" aria-live="polite" aria-label={`${value.length} digits entered`}>
        {Array.from({ length: Math.max(PIN_MIN, value.length) }, (_, i) => (
          <span key={i} className={`w-3 h-3 rounded-full border ${i < value.length ? "bg-gold border-gold" : "border-borderC"}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
          <button key={d} type="button" className={key} disabled={disabled} onClick={() => press(d)}>{d}</button>
        ))}
        <span />
        <button type="button" className={key} disabled={disabled} onClick={() => press("0")}>0</button>
        <button type="button" className={`${key} flex items-center justify-center`} disabled={disabled || !value} onClick={() => onChange(value.slice(0, -1))} aria-label="Delete the last digit">
          <Delete size={20} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

// What shows in place of YOUrnal while it's locked.
export function JournalLockScreen({ onUnlocked }) {
  const { userId } = useAuth();
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [, tick] = useState(0);
  const waiting = waitUntil > Date.now();

  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [waiting]);

  async function tryPin(value = pin) {
    if (value.length < PIN_MIN || waiting) return;
    if (await pinMatches(userId, value)) {
      markOpen(userId);
      onUnlocked();
      return;
    }
    const n = wrong + 1;
    setWrong(n);
    setPin("");
    if (n % TRIES === 0) setWaitUntil(Date.now() + WAIT_MS);
  }

  return (
    <div className="flex flex-col items-center text-center pt-10 pb-6">
      <span className="w-14 h-14 rounded-full bg-surface1 border border-borderC flex items-center justify-center text-gold mb-3">
        <Lock size={22} strokeWidth={1.75} />
      </span>
      <h1 className="font-serif text-h2 text-textPrimary m-0">YOUrnal is locked</h1>
      <p className="text-bodySm text-textSecondary m-0 mt-1 mb-6">Enter your PIN to open it.</p>
      <PinPad value={pin} onChange={setPin} disabled={waiting} onDone={tryPin} />
      <div className="min-h-[44px] mt-4 text-bodySm" role="alert">
        {waiting ? (
          <span className="text-textSecondary">Too many tries. Try again in {Math.ceil((waitUntil - Date.now()) / 1000)} s.</span>
        ) : wrong > 0 ? (
          <span className="text-red-500">That's not it. Try again.</span>
        ) : null}
      </div>
      {pin.length >= PIN_MIN && pin.length < PIN_MAX && (
        <Button size="sm" onClick={() => tryPin()} disabled={waiting}>Open</Button>
      )}
      <p className="text-caption text-textMuted mt-6 max-w-[30ch]">
        Forgot your PIN? Sign out and back in: the lock comes off this device and your entries are all still there.
      </p>
    </div>
  );
}

// Setting, changing or removing the lock. Changing or removing asks for the
// current PIN first.
export function JournalLockSettings({ open, onClose, onChanged }) {
  const { userId } = useAuth();
  const isSet = lockIsSet(userId);
  const [step, setStep] = useState("menu");
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [note, setNote] = useState("");
  const [next, setNext] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep(isSet ? "menu" : "new");
    setPin("");
    setFirst("");
    setNote("");
    setNext(null);
  }, [open, isSet]);

  async function onPin(value) {
    if (value.length < PIN_MIN) return;
    if (step === "current") {
      if (!(await pinMatches(userId, value))) { setNote("That's not your current PIN."); setPin(""); return; }
      setPin("");
      setNote("");
      if (next === "remove") {
        removeLock(userId);
        onChanged();
        onClose();
      } else setStep("new");
    } else if (step === "new") {
      setFirst(value);
      setPin("");
      setNote("");
      setStep("again");
    } else if (step === "again") {
      if (value !== first) { setNote("Those didn't match. Choose your PIN again."); setPin(""); setFirst(""); setStep("new"); return; }
      await setLock(userId, value);
      onChanged();
      onClose();
    }
  }

  const titles = {
    menu: "YOUrnal lock",
    current: "Your current PIN",
    new: isSet ? "Choose a new PIN" : "Choose a PIN",
    again: "Once more to be sure"
  };

  return (
    <Modal open={open} onClose={onClose} title={titles[step]}>
      {step === "menu" ? (
        <div className="space-y-2.5">
          <p className="text-bodySm text-textSecondary m-0 mb-1">
            YOUrnal asks for your PIN when you open it on this device, and again after you've been away a couple of minutes.
          </p>
          <Button className="w-full" onClick={() => { closeNow(userId); onChanged(); onClose(); }}>Lock it now</Button>
          <Button variant="secondary" className="w-full" onClick={() => { setNext("change"); setStep("current"); }}>Change the PIN</Button>
          <Button variant="secondary" className="w-full" onClick={() => { setNext("remove"); setStep("current"); }}>Turn the lock off</Button>
        </div>
      ) : (
        <div className="pb-1">
          {step === "new" && !isSet && (
            <p className="text-bodySm text-textSecondary m-0 mb-4 text-center">
              {PIN_MIN} to {PIN_MAX} numbers. It keeps YOUrnal private on this device when someone else has your phone. It's kept only here: on another device, set one there too.
            </p>
          )}
          <PinPad value={pin} onChange={setPin} onDone={onPin} />
          <div className="min-h-[24px] mt-3 text-center text-bodySm text-red-500" role="alert">{note}</div>
          <div className="flex justify-center mt-1">
            <Button size="sm" onClick={() => onPin(pin)} disabled={pin.length < PIN_MIN}>
              {step === "again" ? "Set the lock" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
