-- Add has_played column to results table
-- This column tracks whether a player has completed their game for the gameweek

ALTER TABLE results
ADD COLUMN IF NOT EXISTS has_played BOOLEAN DEFAULT false;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_results_has_played ON results(has_played);

-- Comment for documentation
COMMENT ON COLUMN results.has_played IS 'Indicates whether the player has completed their game for this gameweek';
