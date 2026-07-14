# Services

External integrations, isolated so the rest of the app never talks to Supabase directly.

- auth.service.js — magic-link sign in, session check, sign out. Sets global USER_ID.
- db.service.js   — all Supabase reads/writes for items, memory, mood_log.

If you change database providers or add caching, this folder is the only place to edit.
