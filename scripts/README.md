# scripts/

Everything here is either wired into `package.json` or is a reusable
maintenance tool. One-off scripts do not belong in this directory — if you write
one to fix a specific incident, delete it once the incident is closed.

Prior to the August 2026 cleanup this directory held 109 files, almost all of
them one-shot data fixes, diagnostics for long-resolved bugs, and runners for
migrations already applied in production. Keeping migration runners around is a
liability: re-running one can damage live data.

## Dev server

| Script | Used by | Purpose |
|---|---|---|
| `auto-cleanup.js` | `npm run dev` | frees port 3000 and clears stale `.next` lock/build state before starting |
| `emergency-cleanup.sh` | `npm run dev:emergency`, `npm run dev:force`, `npm run clean` | last-resort cleanup when the dev server is wedged |
| `kill-next.sh` | — | kills Next processes and frees ports |
| `kill-next-aggressive.sh` | `npm run kill:all` | broader kill, also clears caches and lock files |

The health monitor, live dashboard, process manager, lock manager and the macOS
launchd watchdog were removed in the August 2026 cleanup. They existed to work
around dev-server instability that Next 16 + Turbopack no longer exhibits, and
their auto-restart-on-memory-growth behaviour risked causing more confusion than
it prevented. `auto-cleanup.js` already degraded gracefully when
`process-manager.js` was unavailable, so its removal needed no code change.

## Maintenance tools

| Script | Purpose |
|---|---|
| `generate-import-template.ts` | regenerates the player-import xlsx template |
| `setup-database.sh` | initial database setup |
| `verify-league-isolation.ts` | integrity check: no data bleeds across leagues |
| `check-player-duplicates.ts` | integrity check: duplicate player rows |
| `seed-test-draft.ts` | seeds a throwaway draft for testing the draft flow |

Run the TypeScript ones with `tsx`:

```bash
npx tsx scripts/verify-league-isolation.ts
```

They read credentials from `.env.local` and talk to the live database. The two
integrity checks are read-only; `seed-test-draft.ts` writes.

## Schema migrations

Migrations are applied by hand through the Supabase SQL editor. See
`supabase/migrations/README.md` for ordering and conventions. Do not add
migration-runner scripts here.
