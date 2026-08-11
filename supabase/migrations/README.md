# Migrations

These files describe the state of a **live production database**. Do not
rename, renumber or delete any of them — they are the audit trail, and the
numeric prefixes no longer uniquely order them (see Collisions below).

## Convention going forward

`NNN_description.sql`, strictly sequential, one number per migration, never
reused. The next free number is **032**.

**Check every branch before picking a number**, not just your own —
`git ls-tree --name-only <branch> -- supabase/migrations/`. Unmerged branches
hold numbers that do not exist on main; 029 and 030 are already taken by
`feat/draft-ux-overhaul`.

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
| 2025-10-17 | `003_cup_rls_policies_v2.sql` (`003_cup_rls_policies.sql` sits beside it but was NEVER APPLIED — see below) |
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
| 2026-08-02 | `028_add_draft_delegations.sql` (reconstructed; table itself applied 2026-07-31) |
| 2026-08-02 | `031_players_league_id.sql` — **NOT YET APPLIED**, run before deploying the league-isolation code |

029 and 030 are taken by `feat/draft-ux-overhaul` (`029_skip_keeps_pick_order`,
`030_add_public_leagues`), which is why the players change is numbered 031.
Check every branch, not just your own, before picking a number.

Note that add-date is a proxy, not proof, of when a migration was run against
production. Several files numbered 004–009 were committed *after*
008 and after the unnumbered ones.

## Missing from the audit trail — CLOSED 2026-08-02

The `draft_delegations` table existed in production (applied 2026-07-31) with
**no migration file anywhere in this repo** — nothing in `supabase/migrations/`
or git history created it. It went straight through the SQL editor and the SQL
was never committed.

This is the exact failure mode the numbering convention exists to prevent: the
repo did not describe the live schema, and the draft code that depends on the
table lives on `feat/draft-ux-overhaul`. Had that branch merged first, a
rebuild-from-migrations would have produced a draft page failing against a
table nothing creates.

Closed by `028_add_draft_delegations.sql`, reconstructed from the live database
(`information_schema.columns`, `pg_constraint`, `pg_indexes`, `pg_policies`)
and marked already-applied. No further action needed.

**If you apply schema changes through the SQL editor, commit the SQL in the
same session.** Nothing in the toolchain will catch it later — this one was
found only because a table appeared in the REST API that no file explained.

## Collisions

| Prefix | Files |
|---|---|
| `001_` | `add_league_dates`, `remove_max_managers` |
| `003_` | `add_admin_lineup_tracking`, `cup_rls_policies_v2` (+ `cup_rls_policies`, never applied) |
| `017_` | `add_football_league`, `add_league_admins`, `fix_transfer_validation` |

Unnumbered: `add_club_column.sql`, `20251016_add_performance_indexes.sql`, and
`migrations/add_has_played_to_results.sql`, which sits in the wrong directory
(the repo-root `migrations/` folder, which otherwise holds xlsx templates).

### 021 / 023

`021_add_player_country.sql` was reverted by `023_drop_player_country.sql`.
Country data now lives in `players.football_league`, which holds Polish country
nouns ("Anglia", "Niemcy"), not adjectives.

### 003_cup_rls_policies vs _v2 — RESOLVED 2026-08-02: v2 is live

`003_cup_rls_policies_v2.sql` is what production runs.

**`003_cup_rls_policies.sql` (v1) was never applied. Do not run it.** It is kept
only so the numbering history stays intact; it does not describe any state this
database has ever been in.

Verified by querying `pg_policies` in the Supabase SQL editor (that view is not
reachable from outside the database — PostgREST does not expose system views,
and this project has no `exec_sql` RPC).

The two files were distinguishable by policy name: v1 created four policies per
table (`_select_`/`_insert_`/`_update_`/`_delete_policy`), v2 creates two
(`_select_policy` and `_admin_all_policy`). v1 had 15 policies that v2 does not
define, and **none of those 15 exist in production**. The live set is exactly
v2's 15 policies, plus two `cup_lineup_history` policies from a later migration:

```
cup_gameweeks        cup_gameweeks_admin_all_policy / _select_policy
cup_group_standings  cup_group_standings_admin_all_policy / _select_policy
cup_groups           cup_groups_admin_all_policy / _select_policy
cup_lineups          cup_lineups_admin_all_policy / _select_ / _insert_ / _update_ / _delete_policy
cup_matches          cup_matches_admin_all_policy / _select_policy
cups                 cups_admin_all_policy / _select_policy
cup_lineup_history   "Admins can view all cup lineup history"
                     "Users can view their own cup lineup history"
```

v1 was therefore a superseded draft rather than history: v2's header calls
itself a "Simplified version", and since both files create `cups_select_policy`,
applying v1 first would have made v2 fail on a duplicate policy name.

It is retained rather than deleted because these files are the audit trail for a
live database — but treat it as a dead draft, not as migration `003`.

## Related

There is no application code that applies migrations. The endpoints that used
to — `/api/admin/migrate`, `/api/admin/migrate-names` and
`/api/admin/migration/{import,template,sql,verify}` — were removed in the
August 2026 cleanup: none had any UI calling them, and `migrate` could not work
at all because it called an `exec_sql` RPC this project does not define.

The historical xlsx import they supported (the WNC season) has already run. If
a future season needs importing, recover them from git history rather than
assuming they still exist. The player import at `/api/admin/players/import` is
a different, live endpoint and was not touched.
