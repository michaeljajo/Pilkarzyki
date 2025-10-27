-- Add club column to players table for displaying player's club/team
-- This is informational only and doesn't affect game logic

ALTER TABLE players ADD COLUMN IF NOT EXISTS club TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN players.club IS 'Player club/team name - informational only, not used in game logic';
