# Migration 022 — Live Draft

Adds the draft data model (`drafts`, `draft_picks`, `draft_messages`), the atomic
state-transition functions, RLS policies, and realtime publication membership for
the Season 2026/27 live draft.

Also apply the two supporting migrations first if not already applied:

- `020_add_max_managers.sql` — configurable league size (`leagues.max_managers`, default 18)
- `021_add_player_country.sql` — `players.country` column for the new import

## How to apply

### Option A — SQL editor (recommended for 022)

Migration 022 defines Postgres functions whose bodies contain semicolons, so it
cannot be split statement-by-statement. Paste the **entire** file into the
Supabase SQL editor and run it:

1. Open https://supabase.com/dashboard → your project → **SQL Editor**.
2. Paste the full contents of `supabase/migrations/022_add_draft.sql`.
3. Click **Run**.

It is safe to re-run (uses `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE
FUNCTION`, `DROP POLICY IF EXISTS`, and an idempotent publication `DO` block).

For 020 and 021 you can either paste them the same way or run the scripts:

```bash
npx tsx scripts/run-migration-020.ts
npx tsx scripts/run-migration-021.ts
```

### Option B — runner script

If your database exposes an `exec_sql(sql_string text)` RPC that can execute a
multi-statement script:

```bash
npx tsx scripts/run-migration-022.ts
```

The script sends the whole file in one call and verifies the `drafts` table
afterwards. If it fails, fall back to Option A.

## Verify

- `drafts`, `draft_picks`, `draft_messages` tables exist.
- Functions exist: `draft_start`, `draft_make_pick`, `draft_admin_pick`,
  `draft_skip`, `draft_undo` (and internal `_draft_commit_pick`,
  `_draft_finalize`, `_draft_unfinalize`).
- The three tables are members of the `supabase_realtime` publication:

```sql
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
  AND tablename IN ('drafts', 'draft_picks', 'draft_messages');
```
