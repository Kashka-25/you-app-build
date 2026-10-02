import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, MapPin, Globe2 } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey } from "../../lib/week";
import { stopDateLabel, isExact } from "../../lib/wandering";
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
  const { wanderings, wanderingStops, moments, journalEntries, items, releasedItems } = useAppData();
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
    ordered.forEach((w, wi) => {
      const travelled = doneDreams.has(w.item_id);
      const been = wanderingStops
        .filter(s => s.wandering_id === w.id && (year
          ? s.arrive && Number(s.arrive.slice(0, 4)) === year
          : travelled || (s.arrive && s.arrive <= today)))
        .sort((a, b) => a.position - b.position);
      if (!been.length) return;
      const color = ROUTE_COLORS[wi % ROUTE_COLORS.length];
      if (been.length > 1) routes.push({ wandering: w, color, coords: been.map(s => [s.lng, s.lat]) });
      been.forEach(s => places.push({ stop: s, wandering: w, color, memories: memoryCount[s.id] || 0 }));
    });
    const countries = [...new Set(places.map(p => p.stop.country_code).filter(Boolean))].map(c => regionName(c)).filter(Boolean).sort();
    const placeCount = new Set(places.map(p => `${p.stop.place_name}|${p.stop.lat.toFixed(2)}|${p.stop.lng.toFixed(2)}`)).size;
    return { routes, places, countries, placeCount, wanderingCount: new Set(places.map(p => p.wandering.id)).size };
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
        paint: { "text-color": "#EDE6D6", "text-halo-color": "#070b14", "text-halo-width": 1.2 }
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
      ["places-core", "places-glow"].forEach(layer => {
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

  const { places, countries, placeCount, wanderingCount } = data;

  return (
    <div className="fixed inset-0 z-[70] font-sans" style={{ background: "#070b14" }}>
      {/* MapLibre sets position: relative on its container, so the map
          fills a full-screen wrapper rather than being positioned itself. */}
      <div className="absolute inset-0 night-map">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Header floats over the map; only its controls take touches. */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-6 pb-8 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(7,11,20,0.92) 40%, rgba(7,11,20,0))" }}>
        <button onClick={onClose} className="pointer-events-auto flex items-center gap-1.5 text-caption uppercase tracking-wide mb-3" style={{ color: "#8B8E87" }}>
          <X size={14} strokeWidth={1.75} /> Back
        </button>
        <div className="text-caption uppercase tracking-wide text-gold mb-0.5">Your world</div>
        <div className="font-serif text-h2 font-medium text-cream">{year ? `Where you went in ${year}` : "Everywhere you've been"}</div>
        {places.length > 0 ? (
          <>
            <div className="text-bodySm mt-0.5" style={{ color: "#B8B3A9" }}>
              {placeCount} {placeCount === 1 ? "place" : "places"} · {countries.length} {countries.length === 1 ? "country" : "countries"} · {wanderingCount} {wanderingCount === 1 ? "wandering" : "wanderings"}
            </div>
            {countries.length > 0 && (
              <div className="text-caption mt-1" style={{ color: "#8B8E87" }}>{countries.join(" · ")}</div>
            )}
          </>
        ) : (
          <div className="pointer-events-auto text-bodySm mt-2 max-w-[38ch]" style={{ color: "#B8B3A9" }}>
            No places yet. When a wandering's first day arrives, its places start to glow here.{" "}
            <Link to="/pursue" className="underline" style={{ color: "var(--gold)" }}>Plan one from a Dream →</Link>
          </div>
        )}
        {loadError && (
          <div className="text-caption mt-2" style={{ color: "#C75B5B" }}>The map couldn't load. Check your connection.</div>
        )}
      </div>

      {selected && (
        <div className="absolute left-3 right-3 bottom-10 rounded-card p-4 shadow-cardDark" style={{ background: "#141816", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-start gap-2.5">
            <MapPin size={18} strokeWidth={1.75} className="flex-none mt-0.5" style={{ color: selected.color }} />
            <div className="flex-1 min-w-0">
              <div className="font-serif text-h3 text-cream">{selected.stop.place_name}</div>
              {selected.stop.place_detail && <div className="text-caption" style={{ color: "#8B8E87" }}>{selected.stop.place_detail}</div>}
              <div className="text-bodySm mt-1" style={{ color: "#B8B3A9" }}>
                {selected.wandering.title}
                {selected.stop.arrive && isExact(selected.stop) && ` · ${new Date(selected.stop.arrive + "T00:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`}
              </div>
              {selected.stop.arrive && <div className="text-caption" style={{ color: "#8B8E87" }}>{stopDateLabel(selected.stop)}</div>}
              <div className="text-caption mt-0.5" style={{ color: "#8B8E87" }}>
                {selected.memories > 0
                  ? `${selected.memories} ${selected.memories === 1 ? "memory" : "memories"} from here`
                  : "Nothing pinned here yet"}
              </div>
              <Link to={`/wandering/${selected.wandering.id}`} className="inline-block mt-2 text-bodySm underline" style={{ color: "var(--gold)" }}>
                Open the wandering →
              </Link>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Close" style={{ color: "#8B8E87" }}>
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {places.length === 0 && (
        <Globe2 aria-hidden="true" size={56} strokeWidth={1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-cream pointer-events-none" />
      )}
    </div>
  );
}
