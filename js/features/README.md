# Features

Each file is one feature of the app — its rendering and its logic grouped together.
Files here depend on: config, constants, services, utils, and state.js.
They are loaded after those, and before app.js.

- state.js      — global `S` object, user profile, stats bar, toast. Load first.
- onboarding.js — first-run flow (name, birth data, value selection)
- avatar.js     — Seed Being avatar, environments, level-up overlay
- pursue.js     — the core: add/complete/un-achieve/edit/delete items + card HTML
- memory.js     — Memory Bank list
- tags.js       — Tags tab (groups items by #tag)
- pillars.js    — Pillars tab (XP per life category)
- values.js     — Values tab (sliders, challenges, breakthroughs)
- calendar.js   — calendar grid + mood/energy logging
