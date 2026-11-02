# YOU Realm — art brief for the catalog

**Hand this file to your image AI (ChatGPT, Scenario, Leonardo, Midjourney…) together with the reference images in section 1.**

YOU has a life game called the Realm. Its opening screen is one painted scene: the player's **Sanctuary** (their home and land), their **character** and their **companion**. Like The Sims, every place in that scene is a **slot**, and players choose what goes in it from a **catalog**. When a player levels up a part of their real life, the next tier of that slot's catalog opens, with **one version in each of five style sets**, and they buy the one they like with coins.

The app builds the scene from **separate transparent layers**, so every catalog item is painted on its own, in one shared style, at the same scale and camera angle, so it drops into its spot.

---

## 1. Reference images to upload

1. The YOU concept image (the plum-and-gold game dashboard with the man, the grey wolf and the round garden pavilion). Use it for **painting style, light and palette**.
2. The character previews in `web-next/public/images/realm/characters/` (Alchemist, Wayfinder, Lantern-bearer, Elder, Botanist, Scholar). Use each one as **the exact reference for that character**.
3. Once you've approved your first images, upload **those** as references too, so everything after matches them.

## 2. The house style (paste at the start of every request)

> Painterly digital fantasy concept art in a warm, enchanted, botanical style. Soft visible brushwork, rich detail, glowing golden-hour light from the upper left, gentle rim light, lavender, ferns, ivy and moss, antique gold and amethyst accents. Cosy, hopeful, magical — never dark, scary or gritty. Consistent with the attached reference images. No text, no logos, no UI, no borders, no watermark, no signature.

## 3. Technical rules

- **Camera:** always the same. Eye level, slight 3/4 view, ground seen gently from above like a stage, no tilt, no fisheye.
- **Light:** always from the upper left, warm daylight. (The app makes night itself.)
- **Transparent background** for everything except the scene background: just the object or figure, with no floor, scenery or background colour. If the tool can't do transparency, use a **flat solid magenta (#FF00FF)** background and I'll cut it out.
- **Same footprint within a slot:** every item for a slot (every tier, every style) sits in the same spot on its canvas, at the same size, on the same ground line, so any item swaps in cleanly.
- **Natural colours:** paint furniture and objects in their natural materials. The app offers colourways (plum, sage, rose, midnight) by recolouring them, so don't make everything one strong colour.
- **Tiers grow:** tier 1 is modest, tier 4 is magnificent. Each tier should look clearly richer than the one before, even at phone size.

## 4. The five style sets

Every tier of every slot comes in each of these. They are what make each player's home their own.

| Style | Materials and feel |
|---|---|
| **Cottage** | warm timber, thatch, stone, wildflowers, patchwork, copper |
| **Elven** | living wood grown into shapes, silver filigree, leaves, moonflowers, flowing silk |
| **Desert** | sandstone, terracotta, brass lanterns, woven rugs, silk canopies, palms and succulents |
| **Coastal** | driftwood, rope, shells, sea-glass, white plaster, sails, beach grasses |
| **Celestial** | moonstone, midnight-blue enamel, gold stars, crystal, soft inner glow |

## 5. The scene and its slots

The scene is a **4:5 portrait canvas (2000 × 2500 px)**. Each slot lives in a zone (percentages of width and height, from the top left):

| Slot | Zone on the scene | Grows with |
|---|---|---|
| Background | whole canvas | — |
| Study | back left: x 2–44%, y 14–56% | Purpose |
| Pavilion | back right: x 56–98%, y 18–56% | Play |
| Gardens | front right: x 55–100%, y 48–96% | Home & Earth |
| Hearth | front left: x 0–42%, y 60–98% | Connection |
| Character (outfit) | centre: x 28–68%, y 28–97%, feet at 97% | Body |
| Relic | floating beside the character's head: x 18–34%, y 30–48% | Mind |
| Companion | front, right of the character: x 58–84%, y 68–97% | Heart |
| Decor: lights | across the top: x 6–94%, y 8–22% | Path rank |
| Decor: path | front centre: x 34–66%, y 82–98% | Path rank |
| Decor: ornament | middle: x 44–56%, y 46–60% | Path rank |

The character's aura, fireflies, crown of stars and halo (Spirit) are drawn by the app as light, so they need no art.

## 6. The catalog

### A. Background — `env-day.png`, 2000 × 2500, not transparent

> [STYLE] A wide enchanted forest clearing as a stage for a game scene, portrait 4:5. Ancient trees and hanging ivy frame the top and sides, golden sky through the canopy, distant misty hills. The lower half is an open mossy clearing with a winding stone path from the front centre into the distance. The back left, back right and front left are **open, level, empty ground**, and the front right has a gentle slope with a small stream source. Lavender and ferns only at the very edges. **No buildings, furniture, people or animals.**

### B. Sanctuary places — 4 slots, transparent, 1200 × 1200

For each slot: **tier 0** once (it's where everyone starts, no style), then **tiers 1–4 in each of the 5 styles**. File names: `<slot>-t0.png` and `<slot>-t<tier>-<style>.png`, for example `study-t2-elven.png`.

| Tier | Study (Purpose) | Pavilion (Play) | Gardens (Home & Earth) | Hearth (Connection) |
|---|---|---|---|---|
| 0 | a small canvas lean-to with a cushion and a candle | a tree stump with a wooden flute on it | bare tilled earth with a watering can | a single log stool |
| 1 Writing hut / easel / sprouts / fire pit | a tiny hut with a writing desk inside | a painting easel with a stool | neat beds of young sprouts and a little sign | a ring-of-stones fire pit with two seats |
| 2 Study / gazebo / waterfall / lounge | a cosy study with round glowing windows | a small open gazebo with an instrument and a lantern | flower beds beside a small rocky waterfall and pool | the fire pit with two cushioned lounge chairs and a rug |
| 3 Map room / domed pavilion / grove / feast | a two-storey study with a map-room balcony | a round domed pavilion with cushions, instruments and a games table | the waterfall garden plus young fruit trees and a bench | a long feasting table with lanterns, food and flowers |
| 4 Observatory / festival / greenhouse / hall | a tower with an observatory dome and telescope | a grand festival pavilion with banners and many lanterns | everything before plus a crystal greenhouse dome and glowing flowers | an open-air gathering hall: posts, a vine roof, fairy lights over the table and fire |

> [STYLE] Isolated on a transparent background: [the tier's description] in the [style] style — [the style's materials and feel]. Sitting on a small patch of ground, 3/4 view from slightly above, lit from the upper left. Same size and position as the other items in this set.

That's 4 × (1 + 20) = **84 images** for the full Sanctuary catalog.

### C. Outfits — per character, transparent, 1000 × 1600

Same person, **same pose, size and position** in every outfit: full body, standing relaxed, facing slightly left, feet at the very bottom, **hands empty**. Tier 0 once, then tiers 1–4 in each style. Files: `characters/<character>/garb-t0.png` and `characters/<character>/garb-t<tier>-<style>.png`.

| Tier | Outfit |
|---|---|
| 0 | simple traveller's linen tunic and trousers, soft cloth shoes |
| 1 | a sashed tunic with a belt and pouches |
| 2 | travelling clothes with sturdy boots and wrist wraps |
| 3 | a long flowing cloak over the outfit |
| 4 | full regalia: a splendid mantle with filigree and a jewelled clasp |

The style decides the details: a Cottage cloak is wool and patchwork, an Elven one is leaf-silk with silver, a Desert one is layered silk and brass, a Coastal one is sail-cloth and rope, a Celestial one is midnight velvet sewn with stars.

> [STYLE] Isolated on a transparent background: full-body painting of [the character, matching the attached reference exactly: face, skin, hair, body]. Wearing [the tier's outfit] in the [style] style — [the style's materials]. Relaxed confident pose, empty hands, facing slightly left, whole body visible, feet at the bottom edge. Same pose, size and position as the previous image of this character.

**The Scholar** keeps the ornate wheelchair in every outfit, styled to match.

That's 1 + 20 = **21 per character**.

### D. Relics (Mind) — transparent, 600 × 600

Floating, softly glowing objects. Tiers 1–4 in each style: `relic-t<tier>-<style>.png`.
- 1: a journal
- 2: a lantern
- 3: a staff topped with a glowing crystal
- 4: an orrery staff, with orbiting rings and tiny planets

That's **20 images**.

### E. The companion — transparent, 1000 × 1000

Its picture follows its **form**, which players evolve with Crystals. Same animal, same pose and position in every form: sitting, facing left toward the character, looking up. Files `comp-wolf-0.png` … `comp-wolf-3.png`:
- 0: a fluffy grey wolf pup
- 1: a grown grey wolf
- 2: a spirit wolf with a silvery coat and a soft violet shimmer
- 3: a star wolf, luminous with tiny stars in its fur and a gentle glowing mane

Its **gear** (Heart) is separate small objects placed at its feet. Tiers 1–4 in each style: `bond-t<tier>-<style>.png`, 500 × 500. These are a woven collar, a gem collar, a draped cloth and a star mantle, each shown laid out on a little cushion.

Optional, so players can choose an animal: the same 4 forms for `comp-fox-*`, `comp-owl-*` and `comp-cat-*`.

### F. Decor — transparent, unlocked by Path rank

One of each in each style: `lights-<style>.png` (a string of lanterns, 2000 × 400), `path-<style>.png` (a short garden path, 800 × 500), `ornament-<style>.png` (a small statue or fountain, 500 × 600). That's **15 images**.

## 7. How to make this many images, and keep them consistent

1. **Phase 1: one style, by hand.** Make the background, all four tier-0 places, the **Cottage** tiers 1–4 of every slot, one character's outfits (tier 0 and Cottage 1–4), the Cottage relics and the four wolf forms. That's about **35 images**. Use ChatGPT, editing each tier from the one before so nothing shifts, and regenerate anything that drifts.
2. **Train a style model on Phase 1.** Upload your best 20–30 approved Phase 1 images to a tool that trains a custom model on your own art (Scenario is built for game assets; Leonardo is the cheaper option). This locks in the YOU look.
3. **Phase 2: generate the rest with the model.** Elven, Desert, Coastal and Celestial versions of every slot, the decor, and the other characters' outfits. With a trained model these come out matching, and quickly.
4. **Check at phone size.** Each tier should look clearly bigger and richer than the last, and each style clearly different.

## 8. How to give them to me

Use these exact names, in one folder (or a zip):

```
realm-art/
  env-day.png
  study-t0.png, study-t1-cottage.png … study-t4-celestial.png
  pavilion-…, gardens-…, hearth-…        (same pattern)
  relic-t1-cottage.png … relic-t4-celestial.png
  bond-t1-cottage.png …
  comp-wolf-0.png … comp-wolf-3.png
  lights-cottage.png, path-cottage.png, ornament-cottage.png …
  characters/wayfinder/garb-t0.png, garb-t1-cottage.png …
```

Drop the folder into `web-next/public/images/realm/items/` (and the character outfits into `web-next/public/images/realm/characters/<character>/`), or tell me where it is. As each piece arrives, I'll fit it to its slot and switch it on in the scene.

## 9. The totals

| Set | Images |
|---|---|
| Background | 1 |
| Sanctuary places | 84 |
| Relics | 20 |
| Companion forms (wolf) | 4 |
| Companion gear | 20 |
| Decor | 15 |
| Outfits, per character | 21 |
| **One character, everything** | **165** |
| Each extra character | +21 |
| Each extra companion animal | +4 |

Phase 1 (about 35 images) is enough to see the whole thing working.
