import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STYLE_URL, applyPalette } from "./mapStyle";

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
      // A whole country (no place beneath it) needs a much wider view than a town.
      const zoom = list[0].place_detail ? 9 : 4;
      map[animate ? "easeTo" : "jumpTo"]({ center: [list[0].lng, list[0].lat], zoom });
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
