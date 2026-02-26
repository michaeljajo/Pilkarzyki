-- Increase penalty takers from 5 to 8

-- Update the max takers constraint
ALTER TABLE cup_penalty_lineups DROP CONSTRAINT cup_penalty_max_takers;
ALTER TABLE cup_penalty_lineups ADD CONSTRAINT cup_penalty_max_takers
    CHECK (array_length(player_ids, 1) <= 8 OR array_length(player_ids, 1) IS NULL);

-- Update the default goals array
ALTER TABLE cup_penalty_lineups ALTER COLUMN goals SET DEFAULT '{0,0,0,0,0,0,0,0}';
