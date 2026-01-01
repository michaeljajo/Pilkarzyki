-- Update lineup constraints to allow 1-3 players instead of exactly 3
-- This applies to both league lineups and cup lineups

-- Drop existing constraints
ALTER TABLE lineups DROP CONSTRAINT IF EXISTS lineup_max_players;
ALTER TABLE cup_lineups DROP CONSTRAINT IF EXISTS cup_lineup_max_players;

-- Add new constraints with min 1 and max 3 players
ALTER TABLE lineups
  ADD CONSTRAINT lineup_player_count
  CHECK (array_length(player_ids, 1) >= 1 AND array_length(player_ids, 1) <= 3);

ALTER TABLE cup_lineups
  ADD CONSTRAINT cup_lineup_player_count
  CHECK (array_length(player_ids, 1) >= 1 AND array_length(player_ids, 1) <= 3);
