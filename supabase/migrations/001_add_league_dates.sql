-- Add start_date and end_date to leagues table for season scheduling
ALTER TABLE leagues
ADD COLUMN start_date TIMESTAMPTZ,
ADD COLUMN end_date TIMESTAMPTZ;

-- Add league_id column to matches table if not exists (for better organization)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='matches' AND column_name='league_id') THEN
        ALTER TABLE matches ADD COLUMN league_id UUID REFERENCES leagues(id) ON DELETE CASCADE;
        CREATE INDEX idx_matches_league ON matches(league_id);
    END IF;
END $$;

-- Update gameweeks table to ensure proper indexing
CREATE INDEX IF NOT EXISTS idx_gameweeks_league_id ON gameweeks(league_id);

-- Comments for clarity
COMMENT ON COLUMN leagues.start_date IS 'Season start date for automatic gameweek scheduling';
COMMENT ON COLUMN leagues.end_date IS 'Season end date for automatic gameweek scheduling';