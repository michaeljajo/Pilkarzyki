-- Migration: Add team names to squads
-- This allows managers to set custom team names for each league they participate in

-- Add team_name column to squads table
ALTER TABLE squads
ADD COLUMN team_name TEXT;

-- Add unique constraint to ensure team names are unique within a league
ALTER TABLE squads
ADD CONSTRAINT squads_league_team_name_unique UNIQUE(league_id, team_name);

-- Add check constraint for team name length and format
ALTER TABLE squads
ADD CONSTRAINT team_name_length CHECK (
    team_name IS NULL OR (
        char_length(team_name) >= 3 AND
        char_length(team_name) <= 30
    )
);

-- Create index for better query performance
CREATE INDEX idx_squads_team_name ON squads(team_name);

-- Comments for documentation
COMMENT ON COLUMN squads.team_name IS 'Custom team name for this manager in this league (3-30 characters, unique per league)';
