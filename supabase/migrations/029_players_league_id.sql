-- =====================================================================
-- Migration 029: Scope players by league_id instead of a league NAME
--
-- THE BUG
--
-- players.league is free text holding a league's NAME ("WNC"), with no
-- foreign key. Every league-scoped player query filtered on that string:
--
--     .eq('league', league.name)
--
-- There are two leagues named "WNC" — the archived 2025/26 season and the
-- new 2026/2027 one. A name match cannot tell them apart, so all 165
-- players belonging to the archived league also matched the new league.
--
-- 16 managers play in both. Because players.manager_id still held their
-- 2025/26 assignments, creating the new league and adding those users made
-- 128 players appear pre-assigned to their squads — data from an archived
-- season leaking into a fresh one, with no draft having taken place.
--
-- Names are not identities. Leagues have ids; this migration makes players
-- reference them.
--
-- WHAT THIS DOES
--
--   1. Adds players.league_id -> leagues(id).
--   2. Backfills it. The 'WNC' ambiguity is resolvable from timestamps:
--      every 'WNC' player was created 2025-11-10..2026-01-23, all before
--      the new WNC existed (2026-08-11), so all 165 belong to the archived
--      league. The rule below generalises that — a player belongs to the
--      newest league of that name created no later than the player.
--   3. Deletes 34 players whose league name ('draft test1', 'sdasds')
--      matches no surviving league. Verified unreferenced by results,
--      draft_picks, lineups.player_ids and cup_lineups.player_ids.
--   4. Enforces NOT NULL + an index, so this cannot silently recur.
--
-- players.league (text) is deliberately KEPT for now. Dropping it is a
-- separate migration, once the application has been running on league_id
-- long enough to be confident nothing still reads it.
--
-- Safe to re-run.
-- =====================================================================

-- 1. The column ------------------------------------------------------------

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id) ON DELETE CASCADE;

-- 2. Backfill --------------------------------------------------------------
-- For each player, pick the most recently created league whose name matches
-- and which already existed when the player was created. That resolves
-- duplicate names to the league actually in play at the time.

UPDATE players p
SET league_id = (
  SELECT l.id
  FROM leagues l
  WHERE l.name = p.league
    AND l.created_at <= p.created_at
  ORDER BY l.created_at DESC
  LIMIT 1
)
WHERE p.league_id IS NULL;

-- Fallback for any player created before its league row (clock skew, or a
-- league recreated after an import): fall back to the oldest league of that
-- name rather than leaving the row unscoped.
UPDATE players p
SET league_id = (
  SELECT l.id
  FROM leagues l
  WHERE l.name = p.league
  ORDER BY l.created_at ASC
  LIMIT 1
)
WHERE p.league_id IS NULL
  AND EXISTS (SELECT 1 FROM leagues l2 WHERE l2.name = p.league);

-- 3. Remove orphans --------------------------------------------------------
-- Players whose league name matches no league at all. Confirmed to have no
-- referencing rows before this migration was written.

DELETE FROM players
WHERE league_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM leagues l WHERE l.name = players.league);

-- 4. Lock it down ----------------------------------------------------------
-- Fails loudly if anything is still unscoped, rather than leaving invisible
-- rows behind.

DO $$
DECLARE unscoped INT;
BEGIN
  SELECT COUNT(*) INTO unscoped FROM players WHERE league_id IS NULL;
  IF unscoped > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce NOT NULL: % players still have no league_id. Investigate before re-running.', unscoped;
  END IF;
END $$;

ALTER TABLE players ALTER COLUMN league_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_league_id ON players (league_id);

-- Manager lookups within a league are the hot path (squad views, draft
-- pools, lineup pickers), and are exactly the queries that were crossing
-- leagues before.
CREATE INDEX IF NOT EXISTS idx_players_league_manager ON players (league_id, manager_id);
