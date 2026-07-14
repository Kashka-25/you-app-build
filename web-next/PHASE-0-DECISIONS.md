# Phase 0 — Design system decisions

Locked. Don't re-litigate these per-screen — extend them if something's
missing, don't invent one-off values.

## Palette
- Light mode = primary default. Values in `src/styles/tokens.css` under `:root`.
- Dark mode = the "Apple Life OS" system (forest/sage/gold/cream), **not**
  the old bark/earth/ember dark palette. One deliberate carry-over: `--ember`
  (`#c4783a` light / `#C4783A` dark) survives as a secondary warm accent —
  use it only for streak flames, breakthrough/celebration moments, warmth
  accents. Never as a primary surface, button, or nav color in either mode.
- **Revised in Phase 1** — dark-mode hex values updated against a supplied
  "botanical garden at dusk" reference set. Base background moved off
  near-black (`#0B0F0D` → `#0F1A14`, forest-tinted) per an explicit "no pure
  black" direction; gold unified with the light-mode value (`#C9A24D`) rather
  than a separate lighter dark-mode gold. Light mode, typography, spacing,
  and icon rules below are unchanged — only the dark palette moved.

## Typography
Use these Tailwind classes, not arbitrary `text-[Npx]`:
- `text-hero` — chapter/hero headlines (28px)
- `text-h1` — screen-level headings (22px)
- `text-h2` — section titles (19px) — this is what `<SectionTitle>` uses
- `text-h3` — card titles (16px)
- `text-body` — primary body copy (14px)
- `text-bodySm` — secondary body/descriptions (13px)
- `text-caption` — captions, helper text (12px)
- `text-label` — uppercase eyebrow labels, pills (11px, tracked)

Headings/hero use `font-serif` (Cormorant Garamond). Everything else
`font-sans` (DM Sans) — this is the default, no need to set it explicitly.

## Spacing / radius / shadow
- 8px grid — stick to Tailwind's default spacing scale (already multiples of 4px/8px).
- `rounded-card` (20px) for cards/sheets/modals. `rounded-sm` (12px) for
  small controls (inputs, chips, small buttons).
- `shadow-card` for elevated surfaces in light mode, `shadow-cardDark` if a
  component needs a stronger shadow specifically in dark mode.

## Icons
Locked to **lucide-react** (installed). Outline style, `strokeWidth={1.75}`
for nav/inline icons, `strokeWidth={2}` for small/filled-looking icons like
the Add button. Don't mix in emoji or a second icon set.

## Imagery — still open
Reference image uses painterly/AI-generated botanical photography as hero
and card backgrounds. Not yet decided: real stock photography vs.
AI-generated art, and exactly which screens get imagery vs. stay
illustration-free. This is the single biggest visual gap between the
current scaffold and the reference — tackle it in Phase 1 or 2, not later.

## What's NOT retrofitted yet
`Primitives.jsx` and `AppShell.jsx` use the new scale. Other components
(ItemCard, AddItemModal, ValuesPanel, PillarsPanel, and all placeholder
screens) still use old arbitrary `text-[13px]`-style values from before
this pass. Migrate them screen-by-screen during Phase 2 rather than as a
single mechanical find-replace — some of those sizes should probably
change anyway once real content/imagery is in place.
