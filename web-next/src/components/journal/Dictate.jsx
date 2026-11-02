import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

// Speaking an entry (Cassidy, Nov 2): the browser's own speech-to-text turns
// what's said into words, shown as they come and added to the entry when a
// phrase is finished. Not every browser has it (Firefox doesn't), so the
// button only appears where it works. The speech goes to the browser's own
// service (Google on Chrome and Android, Apple on Safari), not to YOU.
const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canDictate = Boolean(Recognition);

export default function Dictate({ onText }) {
  const rec = useRef(null);
  const [listening, setListening] = useState(false);
  const [hearing, setHearing] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => rec.current?.abort(), []);

  if (!canDictate) return null;

  function start() {
    setError("");
    const r = new Recognition();
    r.lang = navigator.language || "en-AU";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const said = e.results[i][0].transcript;
        if (e.results[i].isFinal) onText(said.trim());
        else interim += said;
      }
      setHearing(interim);
    };
    r.onerror = e => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("YOU needs your permission to use the microphone. Allow it in your browser, then try again.");
      else if (e.error === "no-speech") setError("Didn't hear anything. Tap the microphone and try again.");
      else if (e.error !== "aborted") setError("Speaking stopped. Tap the microphone to carry on.");
    };
    r.onend = () => { setListening(false); setHearing(""); rec.current = null; };
    rec.current = r;
    r.start();
    setListening(true);
  }

  function stop() {
    rec.current?.stop();
  }

  return (
    <div className="mb-3 -mt-1">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={listening ? stop : start}
          aria-pressed={listening}
          aria-label={listening ? "Stop speaking" : "Speak your entry"}
          className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 rounded-full border text-bodySm transition ${
            listening
              ? "bg-[color-mix(in_srgb,var(--terracotta,#C8665A)_14%,transparent)] border-[#C8665A] text-textPrimary"
              : "bg-surface1 border-borderC text-textSecondary hover:text-textPrimary hover:border-forestAccent"
          }`}
        >
          {listening ? (
            <>
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#C8665A] opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#C8665A]" />
              </span>
              Listening… tap to stop
              <Square size={13} strokeWidth={2} aria-hidden="true" />
            </>
          ) : (
            <>
              <Mic size={16} strokeWidth={1.75} aria-hidden="true" /> Speak it
            </>
          )}
        </button>
      </div>
      {hearing && <p className="text-bodySm text-textMuted italic m-0 mt-2" aria-live="polite">{hearing}…</p>}
      {error && <p className="text-caption text-red-500 m-0 mt-2" role="alert">{error}</p>}
    </div>
  );
}
