-- Add football_league column to players table
-- This stores the real-life football league (e.g., Premier League, La Liga, Ligue 1)
-- This is informational only and doesn't affect game logic

ALTER TABLE players ADD COLUMN IF NOT EXISTS football_league TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN players.football_league IS 'Real-life football league (e.g., Premier League, La Liga) - informational only, not used in game logic';
