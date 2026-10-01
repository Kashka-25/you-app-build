// Shared map styling for every map in YOU (Wandering maps, the world map).
// OpenFreeMap: free vector tiles from OpenStreetMap data, no key needed.
export const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Positron recoloured into YOU's palette — sand land, soft blue-grey water,
// moss parks — with a forest-at-dusk set for dark mode, and a night set for
// the "Everywhere you've been" world map, which lives in the cosmos.
const PALETTE = {
  light: {
    background: "#EFE8DB", water: "#C9D6D8", waterway: "#B7C8CB", park: "#DCE3CC", wood: "#D3DCC2",
    residential: "#E8E0D0", building: "#E3DACB", road: "#F6F2EA", boundary: "#B5AE9E", label: "#4A4A44",
    ice: "#F3EEE4", labelHalo: "#EFE8DB", roadCasing: "#E2D9C8"
  },
  dark: {
    background: "#1A1F1D", water: "#142229", waterway: "#1B2D35", park: "#1E2D22", wood: "#1C2A20",
    residential: "#202624", building: "#242B28", road: "#2A2F2C", boundary: "#4A524D", label: "#B8B3A9",
    ice: "#232A27", labelHalo: "#1A1F1D", roadCasing: "#202523"
  },
  night: {
    background: "#111a1f", water: "#070b14", waterway: "#0b1220", park: "#13201f", wood: "#122019",
    residential: "#152026", building: "#18232a", road: "#1c2830", boundary: "#3b4b55", label: "#8B8E87",
    ice: "#1a252b", labelHalo: "#070b14", roadCasing: "#16212a"
  }
};

function paint(map, layer, prop, value) {
  if (map.getLayer(layer)) {
    try { map.setPaintProperty(layer, prop, value); } catch { /* layer lacks this property */ }
  }
}

// mode: "light" | "dark" | "night"; omitted = follow the app's light/dark.
export function applyPalette(map, mode) {
  const c = PALETTE[mode || (document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light")];
  paint(map, "background", "background-color", c.background);
  paint(map, "water", "fill-color", c.water);
  paint(map, "waterway", "line-color", c.waterway);
  paint(map, "park", "fill-color", c.park);
  paint(map, "landcover_wood", "fill-color", c.wood);
  paint(map, "landuse_residential", "fill-color", c.residential);
  paint(map, "building", "fill-color", c.building);
  // Ice and glaciers default to near-white, which glares on darker palettes.
  ["landcover_ice_shelf", "landcover_glacier"].forEach(l => paint(map, l, "fill-color", c.ice));
  // Every road, rail and runway line: the base style draws them in white
  // and light grey, which glares on the darker palettes once zoomed in.
  map.getStyle().layers
    .filter(l => l.type === "line" && /^(highway|tunnel|road|railway|aeroway)/.test(l.id))
    .forEach(l => paint(map, l.id, "line-color", /casing|dashline/.test(l.id) ? c.roadCasing : c.road));
  ["boundary_2", "boundary_3", "boundary_disputed"].forEach(l => paint(map, l, "line-color", c.boundary));
  map.getStyle().layers
    .filter(l => l.type === "symbol" && (l.id.startsWith("label_") || l.id.startsWith("water_name")))
    .forEach(l => {
      paint(map, l.id, "text-color", c.label);
      paint(map, l.id, "text-halo-color", c.labelHalo);
    });
}
