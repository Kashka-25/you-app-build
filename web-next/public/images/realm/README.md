# Realm art

Art for the YOU page's Realm (`src/components/rpg/`, `src/lib/rpg.js`, `src/lib/realmCatalog.js`).
What to paint, sizes and names: `design/realm-art-brief.md`.

- `characters/alchemist.webp`, `characters/alchemist-scene.webp`, `sanctuary.webp`, `companion.webp`:
  cropped from Cassidy's concept image (Nov 1 2026). They stand in until the layered art arrives.
- `characters/wayfinder.png`, `lanternbearer.png`, `elder.png`, `botanist.png`, `scholar.png`:
  generated in Canva (Nov 1 2026). These are the small 149×199 previews; the full-size
  1088×1456 originals are in Cassidy's Canva uploads. Save them over these files at the same names.
- `items/<item id>.png`: catalog layers (env-day, study-t2-elven, comp-wolf-0, ...).
- `characters/<character>/<outfit id>.png`: outfits (garb-t0, garb-t1-cottage, ...).

When a layer arrives, add its id to `ART_READY` in `src/lib/realmCatalog.js` (outfits as
`<character>/<outfit id>`), and the scene shows it in place of its emblem.
