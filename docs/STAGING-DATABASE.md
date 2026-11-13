# YOU's staging database

Until November 2026 the staging site used the live database, so every test on
staging touched real people's journals. Staging now has its own Supabase
project, **`you-staging`** (ref `oiiznskttnflnekbfykx`, Wandering org, Ireland),
with the same structure as live and **only test accounts and test data**.

| | Live | Staging |
|---|---|---|
| Supabase project | `yikoymzktspamahrsuje` (Sydney) | `oiiznskttnflnekbfykx` (Ireland) |
| Site | https://yourownuniverse.life | https://staging--you-app-build.netlify.app and PR deploy previews |
| Data | real people | test accounts only |

## What was done (13 Nov 2026)
1. **Structure:** `node supabase/staging/setup.mjs --project-ref oiiznskttnflnekbfykx`
   read the live schema (no rows, accounts or files) and built it in staging:
   57 tables, 56 with RLS, 162 policies, 29 functions (19 locked from anon),
   6 triggers, 4 buckets, all matching live. The script refuses the live
   project and any project that already has tables.
2. **Edge Functions:** all 12 of YOU's functions deployed with
   `supabase functions deploy --project-ref oiiznskttnflnekbfykx --use-api`
   (verify_jwt on, as on live). `yourigin-portfolio` belongs to YOUrigin and
   isn't deployed here.

## Still to do, by Cassidy (dashboards)
1. **Netlify → you-app-build → Site configuration → Environment variables.**
   For `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, add values for the
   **Deploy Previews** and **Branch deploys** contexts (leave **Production** as it is):
   - `VITE_SUPABASE_URL` = `https://oiiznskttnflnekbfykx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = staging's anon key (Supabase → you-staging →
     Project Settings → API Keys → `anon`; it's public, like live's)

   Then **Deploys → Trigger deploy** on the `staging` branch.
2. **Supabase → you-staging → Authentication → URL Configuration.**
   Site URL `https://staging--you-app-build.netlify.app`; add redirect URLs
   `https://staging--you-app-build.netlify.app/**` and
   `https://deploy-preview-*--you-app-build.netlify.app/**`.
   Copy the email templates from `supabase/email-templates/` if you want
   staging's emails to look like live's.
3. **Supabase → you-staging → Edge Functions → Secrets** (only what staging needs):
   - `ANTHROPIC_API_KEY`: for the AI features (the same key, or a separate one
     with a low limit). Optional caps: `AI_MONTHLY_BUDGET_USD`, `AI_DAILY_LIMIT`.
   - Leave `NOTION_*` unset so tester feedback on staging doesn't land in the
     real Build Notes, and `KRONK_*` unset (Kronk sign-in is live-only).
4. **Sign up a test account** on the staging site once it's switched over.

## Keeping staging in step
- A migration pasted into live's SQL editor is pasted into staging's too
  (staging first is even better: try it there).
- After a function change, deploy to both projects.
- To start again from scratch: reset the you-staging database in the
  dashboard, then run `supabase/staging/setup.mjs` again.

Local development (`web-next/.env`) still points at live. To develop against
staging, copy `web-next/.env.staging.example` to `web-next/.env` and fill in
the anon key.
