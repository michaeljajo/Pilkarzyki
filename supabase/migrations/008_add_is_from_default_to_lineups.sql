-- Migration: Add is_from_default flag to lineups
-- This flag tracks when a lineup was automatically created from the manager's default lineup

-- Add is_from_default column to lineups table
ALTER TABLE lineups ADD COLUMN IF NOT EXISTS is_from_default BOOLEAN DEFAULT false NOT NULL;

-- Add is_from_default column to cup_lineups table
ALTER TABLE cup_lineups ADD COLUMN IF NOT EXISTS is_from_default BOOLEAN DEFAULT false NOT NULL;

-- Create indexes for better query performance when filtering by this flag
CREATE INDEX IF NOT EXISTS idx_lineups_is_from_default ON lineups(is_from_default) WHERE is_from_default = true;
CREATE INDEX IF NOT EXISTS idx_cup_lineups_is_from_default ON cup_lineups(is_from_default) WHERE is_from_default = true;

-- Comments for documentation
COMMENT ON COLUMN lineups.is_from_default IS 'Indicates if this lineup was automatically created from the manager''s default lineup when they did not set a lineup before the lock date';
COMMENT ON COLUMN cup_lineups.is_from_default IS 'Indicates if this cup lineup was automatically created from the manager''s default cup lineup when they did not set a lineup before the lock date';
