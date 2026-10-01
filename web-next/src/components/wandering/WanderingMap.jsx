import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// OpenFreeMap: free vector tiles from OpenStreetMap data, no key needed.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Positron recoloured into YOU's palette — sand land, soft blue-grey water,
// moss parks — with a forest-at-dusk set for dark mode.
const PALETTE = {
  light: {
    background: "#EFE8DB", water: "#C9D6D8", waterway: "#B7C8CB", park: "#DCE3CC", wood: "#D3DCC2",
    residential: "#E8E0D0", building: "#E3DACB", road: "#F6F2EA", boundary: "#B5AE9E", label: "#4A4A44"
  },
  dark: {
    background: "#1A1F1D", water: "#142229", waterway: "#1B2D35", park: "#1E2D22", wood: "#1C2A20",
    residential: "#202624", building: "#242B28", road: "#2A2F2C", boundary: "#4A524D", label: "#B8B3A9"
  }
};

function paint(map, layer, prop, value) {
  if (map.getLayer(layer)) {
    try { map.setPaintProperty(layer, prop, value); } catch { /* layer lacks this property */ }
  }
}

function applyPalette(map) {
  const c = PALETTE[document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light"];
  paint(map, "background", "background-color", c.background);
  paint(map, "water", "fill-color", c.water);
  paint(map, "waterway", "line-color", c.waterway);
  paint(map, "park", "fill-color", c.park);
  paint(map, "landcover_wood", "fill-color", c.wood);
  paint(map, "landuse_residential", "fill-color", c.residential);
  paint(map, "building", "fill-color", c.building);
  ["highway_minor", "highway_major_inner", "highway_motorway_inner", "highway_path"].forEach(l => paint(map, l, "line-color", c.road));
  ["boundary_2", "boundary_3", "boundary_disputed"].forEach(l => paint(map, l, "line-color", c.boundary));
  map.getStyle().layers
    .filter(l => l.type === "symbol" && l.id.startsWith("label_"))
    .forEach(l => paint(map, l.id, "text-color", c.label));
}

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// The Wandering map: numbered pins in stop order, joined by a dashed gold
// route. Still on arrival (fits all stops without animating); it only moves
// when the Seeker taps a stop.
export default function WanderingMap({ stops, selectedId, onSelect, className = "" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const readyRef = useRef(false);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      applyPalette(map);
      map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: { "line-color": "#C9A24D", "line-width": 2.5, "line-dasharray": [2, 1.5] },
        layout: { "line-cap": "round", "line-join": "round" }
      });
      readyRef.current = true;
      draw(map, stopsRef.current, true);
    });
    mapRef.current = map;

    // Follow the app's light/dark switch.
    const observer = new MutationObserver(() => readyRef.current && applyPalette(map));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

    return () => {
      observer.disconnect();
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  function draw(map, list, fit) {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = list.map((s, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "wandering-pin";
      el.textContent = String(i + 1);
      el.setAttribute("aria-label", `Stop ${i + 1}: ${s.place_name}`);
      el.dataset.id = s.id;
      el.addEventListener("click", e => { e.stopPropagation(); onSelectRef.current?.(s.id); });
      return new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map);
    });
    map.getSource("route")?.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: list.map(s => [s.lng, s.lat]) }
    });
    if (fit) fitAll(map, list, false);
  }

  function fitAll(map, list, animate) {
    if (!list.length) return;
    if (list.length === 1) {
      map[animate ? "easeTo" : "jumpTo"]({ center: [list[0].lng, list[0].lat], zoom: 9 });
      return;
    }
    const b = new maplibregl.LngLatBounds();
    list.forEach(s => b.extend([s.lng, s.lat]));
    // Extra room on the right keeps pins clear of the zoom buttons.
    map.fitBounds(b, { padding: { top: 40, bottom: 48, left: 40, right: 64 }, maxZoom: 10, animate, duration: 600 });
  }

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Redraw when the stops change (added, removed, reordered, moved).
  const signature = stops.map(s => `${s.id}:${s.lat}:${s.lng}`).join("|");
  const prevCount = useRef(stops.length);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    draw(map, stops, stops.length !== prevCount.current);
    prevCount.current = stops.length;
  }, [signature]);

  // Highlight the selected pin, and bring it into view (a user action).
  useEffect(() => {
    markersRef.current.forEach(m => m.getElement().classList.toggle("is-selected", m.getElement().dataset.id === selectedId));
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const s = stops.find(x => x.id === selectedId);
    // Closing a stop zooms back out to the whole route.
    if (!s) {
      fitAll(map, stops, !reducedMotion());
      return;
    }
    const opts = { center: [s.lng, s.lat] };
    if (reducedMotion()) map.jumpTo(opts);
    else map.easeTo({ ...opts, duration: 600 });
  }, [selectedId]);

  return <div ref={containerRef} className={`rounded-card overflow-hidden ${className}`} />;
}
