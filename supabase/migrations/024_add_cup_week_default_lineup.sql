-- Migration 024: Add a separate cup-week league default lineup.
--
-- Managers now set two league defaults:
--   * player_ids          — league lineup for a REGULAR (league-only) gameweek
--   * cup_week_player_ids  — league lineup for a gameweek that ALSO has a cup
--                            match (the manager splits their squad across the
--                            league match and the cup match, so this often
--                            differs from the regular default)
--
-- The cup default lineup itself continues to live in default_cup_lineups.

ALTER TABLE default_lineups
  ADD COLUMN IF NOT EXISTS cup_week_player_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE default_lineups
  DROP CONSTRAINT IF EXISTS default_lineup_cup_week_max_players;

ALTER TABLE default_lineups
  ADD CONSTRAINT default_lineup_cup_week_max_players
  CHECK (array_length(cup_week_player_ids, 1) <= 3);

COMMENT ON COLUMN default_lineups.cup_week_player_ids IS
  'League lineup used to auto-fill a league match in a gameweek that also has a cup match (max 3 players). Regular-week league default lives in player_ids.';
