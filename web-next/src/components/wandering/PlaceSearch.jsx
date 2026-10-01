import { useEffect, useRef, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { searchPlaces } from "../../lib/wandering";

// Type a place, pick from the matches. Searches after a short pause rather
// than on every keystroke (kind to the free place-search service, too).
export default function PlaceSearch({ onPick, placeholder = "Add a stop: type any place" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | searching | done | error
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStatus("searching");
      try {
        setResults(await searchPlaces(query, ctrl.signal));
        setStatus("done");
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error("[PlaceSearch] search failed:", e);
        setStatus("error");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  async function pick(place, i) {
    setAdding(i);
    setError("");
    try {
      await onPick(place);
      setQuery("");
      setResults([]);
      setStatus("idle");
    } catch (e) {
      console.error("[PlaceSearch] add failed:", e);
      setError("Couldn't add that stop. Check your connection and try again.");
    }
    setAdding(null);
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-sm border border-dashed border-borderC bg-surface1 px-3 py-2.5 focus-within:border-forestAccent">
        <Plus size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setError(""); }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 min-w-0 bg-transparent text-body text-textPrimary placeholder:text-textMuted outline-none"
        />
      </div>
      {status === "searching" && <div className="text-caption text-textMuted mt-2 pl-1">Looking…</div>}
      {status === "error" && <div className="text-caption text-error mt-2 pl-1">Place search isn't answering right now. Try again in a moment.</div>}
      {status === "done" && results.length === 0 && (
        <div className="text-caption text-textMuted mt-2 pl-1">No places found. Try the nearest town or city.</div>
      )}
      {results.length > 0 && (
        <ul className="mt-2 rounded-sm border border-borderC bg-surface2 divide-y divide-borderC overflow-hidden">
          {results.map((p, i) => (
            <li key={`${p.name}-${p.lat}-${p.lng}`}>
              <button
                type="button"
                onClick={() => pick(p, i)}
                disabled={adding !== null}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface1 disabled:opacity-60"
              >
                <MapPin size={15} strokeWidth={1.75} className="text-forestAccent mt-0.5 flex-none" />
                <span className="flex-1 min-w-0">
                  <span className="block text-body text-textPrimary">{p.name}</span>
                  {p.detail && <span className="block text-caption text-textMuted">{p.detail}</span>}
                </span>
                {adding === i && <span className="text-caption text-textMuted">Adding…</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-caption text-error mt-2 pl-1">{error}</div>}
      <div className="text-label text-textMuted mt-1.5 pl-1">Place search by OpenStreetMap. Only the place name is sent.</div>
    </div>
  );
}
