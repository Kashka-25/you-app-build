import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, MapPin, Globe2, Plus, Loader2, Star, Check } from "lucide-react";
import { useEscape } from "../ui/useEscape";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey } from "../../lib/week";
import { stopDateLabel, isExact, reversePlace } from "../../lib/wandering";
import SavePlaceSheet from "./SavePlaceSheet";
import { PhotoCarousel } from "../ui/PhotoCarousel";
import { STYLE_URL, applyPalette } from "./mapStyle";

// One colour per Wandering's route, in the same family as the Story of
// You's era colours, so each trip reads as its own thread of light.
const ROUTE_COLORS = ["#C9A24D", "#7a9b76", "#b3607a", "#4a8fa0", "#a06490", "#c4783a", "#6478a0"];

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return code => (code ? dn.of(code.toUpperCase()) : null);
  } catch {
    return code => code;
  }
})();

// "Everywhere you've been": every place you've actually reached — a stop
// whose arrival date has come, or any stop of a Dream already marked done
// (exact dates aren't needed to have been somewhere; future plans don't
// count yet) — on a night-coloured world map, each trip's route in its own
// colour. A place glows brighter the more you remember from it. Still on
// arrival; it moves only when touched.
// `year` (optional) narrows it to the places reached that year (The Mirror,
// Legacy): stops that began that year, exact or approximate.
export default function EverywhereMap({ onClose, year = null }) {
  useEscape(true, onClose);
  const { wanderings, wanderingStops, moments, journalEntries, items, releasedItems, wishVisited, wishToDream } = useAppData();
  const navigate = useNavigate();
  const [wishBusy, setWishBusy] = useState(false);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const today = localDateKey();

  const data = useMemo(() => {
    const memoryCount = {};
    [...moments, ...journalEntries].forEach(m => { if (m.stop_id) memoryCount[m.stop_id] = (memoryCount[m.stop_id] || 0) + 1; });
    const ordered = [...wanderings].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    const routes = [];
    const places = [];
    const doneDreams = new Set([...items, ...releasedItems].filter(i => i.done).map(i => i.id));
    // Places you'd love to go glow apart from the places you've been.
    const wishHome = new Set(wanderings.filter(w => !w.item_id && w.title === "Places I'd love to go").map(w => w.id));
    const wishes = wanderingStops.filter(s => wishHome.has(s.wandering_id)).map(s => ({ stop: s, wandering: wanderings.find(w => w.id === s.wandering_id), wish: true }));
    ordered.forEach((w, wi) => {
      if (wishHome.has(w.id)) return;
      const travelled = doneDreams.has(w.item_id);
      const been = wanderingStops
        .filter(s => s.wandering_id === w.id && (year
          ? s.arrive && Number(s.arrive.slice(0, 4)) === year
          : travelled || (s.arrive && s.arrive <= today)))
        .sort((a, b) => a.position - b.position);
      if (!been.length) return;
      const color = ROUTE_COLORS[wi % ROUTE_COLORS.length];
      // Saved places aren't a journey, so they get no route line between them.
      const journey = Boolean(w.item_id) || w.title !== "Places I've been";
      if (journey && been.length > 1) routes.push({ wandering: w, color, coords: been.map(s => [s.lng, s.lat]) });
      been.forEach(s => places.push({ stop: s, wandering: w, color, memories: memoryCount[s.id] || 0 }));
    });
    const countries = [...new Set(places.map(p => p.stop.country_code).filter(Boolean))].map(c => regionName(c)).filter(Boolean).sort();
    const placeCount = new Set(places.map(p => `${p.stop.place_name}|${p.stop.lat.toFixed(2)}|${p.stop.lng.toFixed(2)}`)).size;
    return { routes, places, wishes, countries, placeCount, wanderingCount: new Set(places.map(p => p.wandering.id)).size };
  }, [wanderings, wanderingStops, moments, journalEntries, items, releasedItems, today, year]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [20, 20],
      zoom: 0.8,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: true
    });
    map.touchZoomRotate.disableRotation();
    // Hold a finger on the map (or right-click) to drop a pin and save that
    // place (Cassidy, Nov 2). A move or second finger cancels the hold.
    let hold = null;
    const cancelHold = () => { clearTimeout(hold); hold = null; };
    map.on("touchstart", e => {
      cancelHold();
      if (e.originalEvent.touches.length !== 1) return;
      const at = e.lngLat;
      hold = setTimeout(() => { hold = null; dropPin(at); }, 600);
    });
    map.on("touchmove", cancelHold);
    map.on("touchend", cancelHold);
    map.on("dragstart", cancelHold);
    map.on("contextmenu", e => dropPin(e.lngLat));
    // Top right, tucked under the header, so a place's card never covers it.
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", e => { if (e?.error?.status >= 400) setLoadError(true); });
    map.on("load", () => {
      applyPalette(map, "night");
      map.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data.routes.map(r => ({ type: "Feature", properties: { color: r.color }, geometry: { type: "LineString", coordinates: r.coords } }))
        }
      });
      map.addLayer({
        id: "routes", type: "line", source: "routes",
        paint: { "line-color": ["get", "color"], "line-width": 1.6, "line-opacity": 0.75, "line-dasharray": [2, 1.5] },
        layout: { "line-cap": "round", "line-join": "round" }
      });
      map.addSource("places", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data.places.map((p, i) => ({
            type: "Feature",
            id: i,
            properties: { i, name: p.stop.place_name, color: p.color, memories: p.memories },
            geometry: { type: "Point", coordinates: [p.stop.lng, p.stop.lat] }
          }))
        }
      });
      // Places you'd love to go: a faint gold ring, not yet lit.
      map.addSource("wishes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data.wishes.map((p, i) => ({ type: "Feature", properties: { i, name: p.stop.place_name }, geometry: { type: "Point", coordinates: [p.stop.lng, p.stop.lat] } }))
        }
      });
      map.addLayer({
        id: "wishes-ring", type: "circle", source: "wishes",
        paint: { "circle-color": "rgba(201,162,77,0.12)", "circle-radius": 7, "circle-stroke-color": "#C9A24D", "circle-stroke-width": 1.5, "circle-stroke-opacity": 0.85 }
      });
      map.addLayer({
        id: "wishes-label", type: "symbol", source: "wishes", minzoom: 2.5,
        layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.3], "text-anchor": "top", "text-font": ["Noto Sans Regular"] },
        paint: { "text-color": "#C9A24D", "text-halo-color": "#07071A", "text-halo-width": 1.2 }
      });
      map.on("click", "wishes-ring", e => {
        const i = e.features?.[0]?.properties?.i;
        if (i != null) setSelected(data.wishes[i]);
      });
      // A soft halo that widens with each memory, then a bright core.
      map.addLayer({
        id: "places-glow", type: "circle", source: "places",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["+", 9, ["*", 3, ["min", ["get", "memories"], 5]]],
          "circle-blur": 1,
          "circle-opacity": 0.55
        }
      });
      map.addLayer({
        id: "places-core", type: "circle", source: "places",
        paint: {
          "circle-color": "#F7F1E1",
          "circle-radius": ["+", 3, ["*", 0.6, ["min", ["get", "memories"], 5]]],
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 1.5
        }
      });
      map.addLayer({
        id: "places-label", type: "symbol", source: "places", minzoom: 2.5,
        layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.3], "text-anchor": "top", "text-font": ["Noto Sans Regular"] },
        paint: { "text-color": "#EDE6D6", "text-halo-color": "#07071A", "text-halo-width": 1.2 }
      });
      // A tap that lands on several places at once (Lisbon, Sintra and
      // Porto at world zoom) zooms in to separate them, rather than guessing.
      map.on("click", e => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["places-core", "places-glow"] });
        const idx = [...new Set(hits.map(f => f.properties.i))];
        if (!idx.length) return;
        const spots = idx.map(i => data.places[i]);
        const distinct = new Set(spots.map(p => `${p.stop.lat.toFixed(3)},${p.stop.lng.toFixed(3)}`));
        if (distinct.size === 1) {
          setSelected(spots[0]);
          return;
        }
        const b = new maplibregl.LngLatBounds();
        spots.forEach(p => b.extend([p.stop.lng, p.stop.lat]));
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        map.fitBounds(b, { padding: { top: 180, bottom: 140, left: 60, right: 60 }, maxZoom: 9, animate: !reduce, duration: 700 });
      });
      ["places-core", "places-glow", "wishes-ring"].forEach(layer => {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      });
      // Fit everywhere you've been, without animating.
      if (data.places.length === 1) {
        map.jumpTo({ center: [data.places[0].stop.lng, data.places[0].stop.lat], zoom: 4 });
      } else if (data.places.length > 1) {
        const b = new maplibregl.LngLatBounds();
        data.places.forEach(p => b.extend([p.stop.lng, p.stop.lat]));
        map.fitBounds(b, { padding: { top: 140, bottom: 90, left: 40, right: 40 }, maxZoom: 5, animate: false });
      }
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [data]);

  const { places, wishes, countries, placeCount, wanderingCount } = data;

  async function wishAction(kind) {
    setWishBusy(true);
    try {
      if (kind === "dream") {
        const w = await wishToDream(selected.stop);
        onClose();
        navigate(`/wandering/${w.id}`);
        return;
      }
      await wishVisited(selected.stop, localDateKey());
      setSelected(null);
    } catch (e) {
      console.error("[EverywhereMap] wish action failed:", e);
    }
    setWishBusy(false);
  }

  // What was lived at the selected place: its memories (photos first) and
  // the YOUrnal entries written there (Cassidy, Nov 2).
  const here = selected && !selected.wish ? {
    moments: moments.filter(m => m.stop_id === selected.stop.id),
    entries: journalEntries.filter(e => e.stop_id === selected.stop.id)
  } : null;

  // Saving a place from the map: the + button opens the sheet; a held finger
  // names the spot under it first and opens the sheet with it chosen.
  const [saveOpen, setSaveOpen] = useState(false);
  const [pin, setPin] = useState(null);
  const [naming, setNaming] = useState(false);
  async function dropPin({ lat, lng }) {
    setSelected(null);
    setNaming(true);
    try {
      setPin(await reversePlace(lat, lng));
      setSaveOpen(true);
    } finally {
      setNaming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] font-sans" style={{ background: "#07071A" }}>
      {/* MapLibre sets position: relative on its container, so the map
          fills a full-screen wrapper rather than being positioned itself. */}
      <div className="absolute inset-0 night-map">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Header floats over the map; only its controls take touches. */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-6 pb-8 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(7,11,20,0.92) 40%, rgba(7,11,20,0))" }}>
        <button onClick={onClose} className="pointer-events-auto flex items-center gap-1.5 text-caption uppercase tracking-wide mb-3" style={{ color: "#8A88AE" }}>
          <X size={14} strokeWidth={1.75} /> Back
        </button>
        <div className="text-caption uppercase tracking-wide text-gold mb-0.5">Your world</div>
        <div className="font-serif text-h2 font-medium text-cream">{year ? `Where you went in ${year}` : "Everywhere you've been"}</div>
        {places.length > 0 ? (
          <>
            <div className="text-bodySm mt-0.5" style={{ color: "#B8B5D6" }}>
              {placeCount} {placeCount === 1 ? "place" : "places"} · {countries.length} {countries.length === 1 ? "country" : "countries"} · {wanderingCount} {wanderingCount === 1 ? "wandering" : "wanderings"}
            </div>
            {countries.length > 0 && (
              <div className="text-caption mt-1" style={{ color: "#8A88AE" }}>{countries.join(" · ")}</div>
            )}
            {wishes.length > 0 && (
              <div className="text-caption mt-1 text-gold">○ {wishes.length} {wishes.length === 1 ? "place" : "places"} you'd love to go</div>
            )}
          </>
        ) : (
          <div className="pointer-events-auto text-bodySm mt-2 max-w-[38ch]" style={{ color: "#B8B5D6" }}>
            No places yet. Save one below, or hold your finger on the map where you've been.
          </div>
        )}
        {loadError && (
          <div className="text-caption mt-2" style={{ color: "#C75B5B" }}>The map couldn't load. Check your connection.</div>
        )}
      </div>

      {selected?.wish && (
        <div className="absolute left-3 right-3 bottom-10 rounded-card p-4 shadow-cardDark" style={{ background: "#131331", border: "1px solid rgba(201,162,77,0.45)" }}>
          <div className="flex items-start gap-2.5">
            <Star size={18} strokeWidth={1.75} className="flex-none mt-0.5 text-gold" />
            <div className="flex-1 min-w-0">
              <div className="text-caption uppercase tracking-wide text-gold">A place you'd love to go</div>
              <div className="font-serif text-h3 text-cream">{selected.stop.place_name}</div>
              {selected.stop.place_detail && <div className="text-caption" style={{ color: "#8A88AE" }}>{selected.stop.place_detail}</div>}
              {selected.stop.note && <p className="text-bodySm italic m-0 mt-1.5" style={{ color: "#B8B5D6" }}>{selected.stop.note}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" disabled={wishBusy} onClick={() => wishAction("dream")} className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full bg-gold text-[#19193D] text-bodySm font-medium disabled:opacity-60">
                  <Star size={14} strokeWidth={2} /> Make it a Dream
                </button>
                <button type="button" disabled={wishBusy} onClick={() => wishAction("been")} className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full border text-bodySm disabled:opacity-60" style={{ borderColor: "rgba(255,255,255,0.2)", color: "#EDE6D6" }}>
                  <Check size={14} strokeWidth={2} /> I've been here now
                </button>
              </div>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Close" style={{ color: "#8A88AE" }}>
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {selected && !selected.wish && (
        <div className="absolute left-3 right-3 bottom-10 max-h-[62vh] overflow-y-auto rounded-card p-4 shadow-cardDark" style={{ background: "#131331", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-2.5">
            <MapPin size={18} strokeWidth={1.75} className="flex-none mt-0.5" style={{ color: selected.color }} />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-h3 text-cream">{selected.stop.place_name}</div>
              {selected.stop.place_detail && <div className="text-caption" style={{ color: "#8A88AE" }}>{selected.stop.place_detail}</div>}
              <div className="text-bodySm mt-1" style={{ color: "#B8B5D6" }}>
                {selected.wandering.title}
                {selected.stop.arrive && isExact(selected.stop) && ` · ${new Date(selected.stop.arrive + "T00:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`}
              </div>
              {selected.stop.arrive && <div className="text-caption" style={{ color: "#8A88AE" }}>{stopDateLabel(selected.stop)}</div>}
              {selected.memories === 0 && (
                <div className="text-caption mt-0.5" style={{ color: "#8A88AE" }}>Nothing pinned here yet</div>
              )}
              <Link to={`/wandering/${selected.wandering.id}`} className="inline-block mt-2 text-bodySm underline" style={{ color: "var(--gold)" }}>
                Open the wandering →
              </Link>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Close" style={{ color: "#8A88AE" }}>
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {(here.moments.length > 0 || here.entries.length > 0) && (
            <div className="mt-3 space-y-3">
              {here.moments.map(m => (
                <div key={m.id}>
                  {m.photo_urls?.length > 0 && <PhotoCarousel urls={m.photo_urls} className="h-44" />}
                  <div className="mt-1.5 flex items-baseline justify-between gap-2">
                    <span className="font-serif text-body text-cream">{m.title}</span>
                    <span className="flex-none text-caption" style={{ color: "#8A88AE" }}>
                      {new Date(m.moment_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {m.description && <p className="text-bodySm m-0 mt-0.5 whitespace-pre-line" style={{ color: "#B8B5D6" }}>{m.description}</p>}
                </div>
              ))}
              {here.entries.map(e => (
                <div key={e.id} className="border-l-2 pl-2.5" style={{ borderColor: "rgba(201,162,77,0.6)" }}>
                  <div className="text-caption" style={{ color: "#8A88AE" }}>
                    YOUrnal · {new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <p className="text-bodySm m-0 mt-0.5 line-clamp-4 whitespace-pre-line" style={{ color: "#B8B5D6" }}>{e.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="absolute left-0 right-0 bottom-8 flex flex-col items-center gap-1.5 pointer-events-none">
          <button
            type="button"
            onClick={() => { setPin(null); setSaveOpen(true); }}
            className="pointer-events-auto inline-flex items-center gap-2 min-h-[46px] px-5 rounded-full bg-gold text-[#19193D] font-medium text-body shadow-cardDark"
          >
            {naming ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} strokeWidth={2.25} />}
            {naming ? "Finding that spot…" : "Save a place"}
          </button>
          <span className="text-caption" style={{ color: "#8A88AE" }}>or hold your finger on the map to drop a pin</span>
        </div>
      )}

      <SavePlaceSheet
        open={saveOpen}
        place={pin}
        layer="z-[80]"
        onClose={() => { setSaveOpen(false); setPin(null); }}
      />

      {places.length === 0 && (
        <Globe2 aria-hidden="true" size={56} strokeWidth={1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-cream pointer-events-none" />
      )}
    </div>
  );
}
