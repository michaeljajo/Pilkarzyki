# Database triggers

Rules enforced by Postgres rather than by application code. They fire regardless
of which client writes — including `supabaseAdmin`, which bypasses RLS — so they
are the last line of defence for data integrity.

This file was written while removing `scripts/test-league-triggers.ts`, an
ad-hoc harness that probed these triggers by attempting invalid writes against
the live database. The knowledge is worth more than the script.

## League isolation

Defined in `supabase/migrations/016_add_league_safeguards.sql`, with the
transfer trigger later replaced by `017_fix_transfer_validation.sql`.

A player belongs to exactly one league. `players.league` holds the league
**name**, not its id — that indirection is why these triggers exist, since a
plain foreign key cannot express the constraint.

| Trigger | Table | Fires | Rejects |
|---|---|---|---|
| `trigger_validate_transfer_league` | `player_transfers` | BEFORE INSERT OR UPDATE | a transfer whose `league_id` is not the league owning `player_id` |
| `trigger_validate_squad_player_league` | `squad_players` | BEFORE INSERT OR UPDATE | adding a player to a squad belonging to a different league |
| `trigger_validate_lineup_player_league` | `lineups` | BEFORE INSERT OR UPDATE | a lineup containing a player from a different league |

Each raises an exception, so the write fails rather than silently corrupting
cross-league data. Application code should treat these as assertions that
should never fire — if one does, the bug is upstream.

Migration 017 relaxed the transfer trigger in one respect: it tolerates a player
whose league name does not resolve to a `leagues` row (`v_player_league_name IS
NOT NULL` guard), so historical/unattached players do not block transfers.

## Transfer bookkeeping

Defined in `supabase/migrations/014_add_player_transfers.sql`.

| Trigger | Table | Effect |
|---|---|---|
| `trigger_sync_player_manager_id` | `player_transfers` | keeps `players.manager_id` in step with the active transfer row |
| `trigger_close_previous_transfer` | `player_transfers` | sets `effective_until` on the prior row so exactly one transfer is open per player |

Consequence: **do not write `players.manager_id` directly** when a transfer is
what you mean. Insert a `player_transfers` row and let the trigger sync it, or
the two will disagree.

## Housekeeping

Numerous `update_*_updated_at` triggers maintain `updated_at` on write across
`cups`, `cup_matches`, `cup_lineups`, `cup_group_standings`, `cup_et_lineups`,
`cup_penalty_lineups`, `drafts`, `posts`, `manual_tiebreakers`,
`cup_manual_tiebreakers` and `player_transfers`. Application code does not need
to set `updated_at`.

## Own goals

Not a trigger, but the same category of non-obvious rule, implemented in
`src/utils/own-goal-calculator.ts`:

- A result of `-1` means an **own goal**.
- An own goal adds 1 to the **opponent's** match score.
- An own goal never counts toward the scoring player's or lineup's total goals.

Both functions in that file document this at the call site; the former
`scripts/test-own-goal-logic.ts` asserted exactly these cases and was removed as
redundant.
