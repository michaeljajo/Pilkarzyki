# Migrations

These files describe the state of a **live production database**. Do not
rename, renumber or delete any of them — they are the audit trail, and the
numeric prefixes no longer uniquely order them (see Collisions below).

## Convention going forward

`NNN_description.sql`, strictly sequential, one number per migration, never
reused. The next free number is **028**.

Migrations are applied by hand through the Supabase SQL editor. There is no
migration runner, and scripts that re-applied migrations were deliberately
removed — re-running one against live data can destroy it.

## Applied order

Prefixes collide, so the real order is the order they were added to the repo.
Reconstructed from `git log --diff-filter=A`:

| Added | File |
|---|---|
| 2025-10-17 | `001_add_league_dates.sql` |
| 2025-10-17 | `001_remove_max_managers.sql` |
| 2025-10-17 | `002_add_cup_tournament.sql` |
| 2025-10-17 | `003_cup_rls_policies.sql` |
| 2025-10-17 | `003_cup_rls_policies_v2.sql` |
| 2025-10-17 | `20251016_add_performance_indexes.sql` |
| 2025-10-20 | `003_add_admin_lineup_tracking.sql` |
| 2025-10-27 | `add_club_column.sql` |
| 2025-11-08 | `008_add_is_from_default_to_lineups.sql` |
| 2025-11-12 | `004_add_default_lineups.sql` |
| 2025-11-12 | `005_add_team_names.sql` |
| 2025-11-12 | `006_add_posts_table.sql` |
| 2025-11-12 | `007_update_goals_range.sql` |
| 2025-11-12 | `009_add_manual_tiebreakers.sql` |
| 2025-11-12 | `../../migrations/add_has_played_to_results.sql` |
| 2025-11-13 | `010_add_knockout_placeholders.sql` |
| 2025-11-13 | `011_add_match_number.sql` |
| 2025-11-14 | `012_add_lineup_history.sql` |
| 2026-01-01 | `013_update_lineup_constraints.sql` |
| 2026-01-14 | `014_add_player_transfers.sql` |
| 2026-01-16 | `015_add_league_to_transfers.sql` |
| 2026-01-16 | `016_add_league_safeguards.sql` |
| 2026-01-19 | `017_add_league_admins.sql` |
| 2026-01-23 | `017_add_football_league.sql` |
| 2026-01-23 | `017_fix_transfer_validation.sql` |
| 2026-02-26 | `018_add_extra_time_and_penalties.sql` |
| 2026-02-26 | `019_increase_penalty_takers_to_8.sql` |
| 2026-07-22 | `020_add_max_managers.sql` |
| 2026-07-22 | `021_add_player_country.sql` |
| 2026-07-22 | `022_add_draft.sql` |
| 2026-07-23 | `023_drop_player_country.sql` |
| 2026-07-27 | `024_add_cup_week_default_lineup.sql` |
| 2026-07-27 | `025_add_player_swap.sql` |
| 2026-07-27 | `026_add_midseason_draft.sql` |
| 2026-07-28 | `027_add_cup_format.sql` |

Note that add-date is a proxy, not proof, of when a migration was run against
production. Several files numbered 004–009 were committed *after*
008 and after the unnumbered ones.

## Missing from the audit trail

The `draft_delegations` table **exists in production** (verified 2026-08-01 via
the REST API) but there is **no migration file for it in this repo** — nothing
in `supabase/migrations/` or git history creates it. It was presumably applied
straight through the SQL editor without the SQL being committed.

This is the failure mode the numbering convention is meant to prevent: the repo
no longer fully describes the live schema. Recover it by dumping the table's
definition from Supabase and committing it as `028_add_draft_delegations.sql`,
marked as already-applied.

## Collisions

| Prefix | Files |
|---|---|
| `001_` | `add_league_dates`, `remove_max_managers` |
| `003_` | `add_admin_lineup_tracking`, `cup_rls_policies`, `cup_rls_policies_v2` |
| `017_` | `add_football_league`, `add_league_admins`, `fix_transfer_validation` |

Unnumbered: `add_club_column.sql`, `20251016_add_performance_indexes.sql`, and
`migrations/add_has_played_to_results.sql`, which sits in the wrong directory
(the repo-root `migrations/` folder, which otherwise holds xlsx templates).

### 021 / 023

`021_add_player_country.sql` was reverted by `023_drop_player_country.sql`.
Country data now lives in `players.football_league`, which holds Polish country
nouns ("Anglia", "Niemcy"), not adjectives.

### 003_cup_rls_policies vs _v2 — UNRESOLVED

Both exist; only one should be live. They are distinguishable by policy name:

- v1 creates four policies per table: `<table>_select_policy`,
  `_insert_policy`, `_update_policy`, `_delete_policy`
- v2 creates two: `<table>_select_policy` and `<table>_admin_all_policy`

This could not be determined from outside the database — `pg_policies` is a
system view and PostgREST does not expose it, and this project has no `exec_sql`
RPC. Run this in the Supabase SQL editor and record the answer here:

```sql
select tablename, policyname
from pg_policies
where tablename like 'cup%'
order by tablename, policyname;
```

If `cups_admin_all_policy` appears, v2 is live. If `cups_insert_policy` appears,
v1 is live. If both appear, they were applied on top of each other and the
policy set needs review.

## Related

`/api/admin/migrate` calls `supabaseAdmin.rpc('exec_sql', ...)`. That RPC does
not exist in this project, so the endpoint returns an error rather than applying
anything. It is dead weight and a candidate for removal.
