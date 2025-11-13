-- Add Knockout Placeholder Support
-- Allows pre-configuration of knockout draws before teams are qualified
-- Stores placeholder references (e.g., "winner_group_A") alongside actual manager IDs

-- Add placeholder source columns to cup_matches
ALTER TABLE cup_matches
  ADD COLUMN home_team_source TEXT,
  ADD COLUMN away_team_source TEXT;

-- Make manager IDs nullable (for unresolved matches)
ALTER TABLE cup_matches
  ALTER COLUMN home_manager_id DROP NOT NULL,
  ALTER COLUMN away_manager_id DROP NOT NULL;

-- Add constraint: either manager_id OR team_source must be present for each team
ALTER TABLE cup_matches
  ADD CONSTRAINT cup_match_team_source_check CHECK (
    (home_manager_id IS NOT NULL OR home_team_source IS NOT NULL) AND
    (away_manager_id IS NOT NULL OR away_team_source IS NOT NULL)
  );

-- Add index for quick placeholder queries
CREATE INDEX idx_cup_matches_placeholders ON cup_matches(home_team_source, away_team_source)
  WHERE home_team_source IS NOT NULL OR away_team_source IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN cup_matches.home_team_source IS 'Placeholder reference for home team (e.g., winner_group_A, runner_up_group_B)';
COMMENT ON COLUMN cup_matches.away_team_source IS 'Placeholder reference for away team (e.g., winner_group_C, runner_up_group_D)';
COMMENT ON CONSTRAINT cup_match_team_source_check ON cup_matches IS 'Ensures each team has either a resolved manager_id or a placeholder team_source';
