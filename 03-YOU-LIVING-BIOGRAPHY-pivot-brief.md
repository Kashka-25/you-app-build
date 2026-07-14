# YOU — Living Biography Pivot Brief

> Companion to `01-YOU-CORE-brief.md` and `02-YOU-PHILOSOPHY-brief.md`. This document supersedes prior scope/stack/build-order decisions where noted. Drop into YOU Core project as knowledge.

---

## What changed

YOU Core is rescoping from a habit/goal tracker with astrology into **"The Living Biography"** — a life-story platform. Not a reskin; a redesign of experience and information architecture, preserving what already works (Supabase auth/data, Seed Being, Values, XP) underneath a new narrative layer.

---

## Terminology (resolved)

- **Seeker** — default identity for every user, from onboarding.
- **Alchemist** — not a separate tier unlock. An Alchemist is a Seeker who *keeps turning their life into the dream they want to be living* — an ongoing practice, not a badge crossed once. Progression system may still track depth of practice, but "Alchemist" is earned through demonstrated pattern, not a fixed XP gate.
- Update copy across app: anywhere "Alchemist" was gated strictly behind Stage 5 of the Seed Being, reframe as recognition of sustained transformation rather than a level-up moment.

---

## Ecosystem boundary decision

**Healing Journey (Empatherapy-powered tab): design now, build later.**

- Full UI/UX, data model, and entry schema get designed as part of this pivot.
- Not built/wired into production until Empatherapy exists as its own mission.
- YOU Core ships with the tab either hidden or as a lightweight placeholder ("Coming: Healing Journey") until Empatherapy is ready to feed it.
- This preserves build order (YOU Core → Empatherapy → Kronk → Elemental Game) while letting the design get done once, correctly, per your feature-scoping discipline (fully design, then park).

---

## Stack decision

**React + Vite migration starts now.**

- This was previously deferred until "a developer joins" — decision is to begin the migration now to support the new design system (Framer Motion, component reuse, Life Atlas rendering).
- Recommend: scaffold new architecture in parallel, port screen-by-screen, keep the vanilla build live/working until parity is reached. Don't do a big-bang cutover.
- Supabase backend, RLS, and data model stay as-is — this is a frontend migration, not a backend rewrite.

---

## Adopted feature set (from Living Biography vision)

Design now; build in this rough order as part of the redesign work:

1. **Life Chapters** — AI-detected periods (not manually created), replacing flat year-based history.
2. **Seasons** — AI-inferred emotional/growth season (e.g. "Season of Letting Go") replacing percentage progress bars.
3. **Living Atlas** — landscape visualization of life areas (replaces Pillars' bar-chart framing; Pillars' underlying XP data can feed it).
4. **Tree of YOU** — growth metaphor tied to actions (courage strengthens trunk, relationships grow branches, etc).
5. **Life Constellations** — star-map of meaningful memories, pulled from Memory Bank entries.
6. **Healing Journey** (designed only, see boundary decision above).
7. **The Mirror** — annual "one year ago" reflection, generated from existing logged data.
8. **Legacy Mode** — long-horizon feature (autobiography export). Design direction only; no near-term build priority.
9. **Living Biography AI** — pattern-noticing layer ("your confidence has quietly grown for 18 months"). This is a Claude-API synthesis job over existing logged data — same integration pattern already planned for astrology synthesis, so build once, use for both.

Existing systems that map into this rather than being replaced:
- Seed Being → stays, becomes a companion presence in the biography narrative rather than a standalone screen.
- Values + Pillars → underlying data source for Tree of YOU / Living Atlas.
- Memory Bank → underlying data source for Constellations.
- Calendar/astrology → feeds Seasons and Mirror alongside mood/energy logs.

---

## Design system (from Living Biography brief)

**Aesthetic shift:** from "dark, earthy, sanctuary-like" (Chapter 1 palette) toward "Apple Life OS" — immersive, glassmorphic, botanical, animated. Existing bark/earth/ember/gold/sage/cream/mist palette can inform the dark mode variant below rather than being discarded outright — needs a design pass to reconcile the two, not an assumption they're identical.

**Light mode**
| Token | Hex |
|---|---|
| Background | `#FCFBF8` |
| Surface | `#F6F2EA` |
| Primary Forest | `#294D3A` |
| Forest Light | `#456A54` |
| Sage | `#7A9B76` |
| Soft Moss | `#B7C7A4` |
| Sand | `#EFE8DB` |
| Warm Gold | `#C9A24D` |
| Cream | `#FFFDF9` |
| Text Primary | `#2B2B2B` |
| Text Secondary | `#6A6A6A` |
| Accent Blue | `#8FB8D8` |
| Error | `#C75B5B` |

**Dark mode**
| Token | Hex |
|---|---|
| Background | `#0B0F0D` |
| Primary Surface | `#141816` |
| Secondary Surface | `#1D2420` |
| Elevated Cards | `#202A25` |
| Deep Forest | `#22392C` |
| Forest Accent | `#365C47` |
| Sage Accent | `#6F8F69` |
| Gold | `#D4AE55` |
| Soft Cream | `#E9E2D2` |
| Primary Text | `#F7F5EF` |
| Secondary Text | `#B8B3A9` |
| Muted Text | `#8B8E87` |
| Border | `rgba(255,255,255,0.05)` |
| Shadow | `rgba(0,0,0,0.45)` |
| Glass Overlay | `rgba(255,255,255,0.04)` |

**Typography:** Cormorant Garamond (headings), DM Sans (body) — unchanged, carries forward.

**Component library to build:** buttons (primary/secondary/ghost/floating/rounded), cards (hero/journey/reflection/healing/event/community/therapist/media/timeline), inputs (rounded search, floating text fields, voice recorder, journal editor, mood selector), consistent outline icon set, 8px spacing grid.

**Motion:** Framer Motion. Slow, elegant, intentional — cards rise, nav glides, pages fade, hero images slow-zoom, progress rings animate. Nothing snaps.

---

## What does NOT change

- Ecosystem build order: YOU Core → Empatherapy → Kronk/CommYOUnity → Elemental Game.
- Supabase as backend; RLS model.
- MAYhem stays fully separate, no YOU network foregrounded.
- YOUphoria stays deferred.
- Sovereignty · Depth · Safety · Meaning · Integrity as tiebreaker principles when scoping trade-offs.

---

## Immediate next steps

1. Reconcile earthy palette vs. new Apple-Life-OS palette into one dark-mode source of truth.
2. Scaffold React + Vite alongside existing vanilla build.
3. Design Healing Journey screens/data model (park, don't wire to production).
4. Fold current UI todo (Pillars/Values attribute-bar redesign) into Tree of YOU / Living Atlas data mapping rather than building it standalone.
