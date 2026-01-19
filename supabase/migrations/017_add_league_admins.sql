-- Migration 017: Add league_admins table for multiple admins per league
-- This replaces the single admin_id foreign key with a many-to-many relationship

-- Create league_admins junction table
CREATE TABLE IF NOT EXISTS league_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(league_id, user_id) -- Prevent duplicate admin assignments
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_league_admins_league_id ON league_admins(league_id);
CREATE INDEX IF NOT EXISTS idx_league_admins_user_id ON league_admins(user_id);

-- Enable RLS
ALTER TABLE league_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view league admins"
  ON league_admins FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage league admins"
  ON league_admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM league_admins la
      WHERE la.league_id = league_admins.league_id
      AND la.user_id = auth.uid()
    )
  );

-- Migrate existing admin_id data to league_admins table
INSERT INTO league_admins (league_id, user_id, created_at)
SELECT id, admin_id, created_at
FROM leagues
WHERE admin_id IS NOT NULL
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE league_admins IS 'Junction table for league administrators - supports multiple admins per league';
COMMENT ON COLUMN league_admins.league_id IS 'Reference to the league';
COMMENT ON COLUMN league_admins.user_id IS 'Reference to the admin user';
COMMENT ON COLUMN league_admins.created_by IS 'User who granted this admin access';

-- Note: We keep the admin_id column in leagues table for backward compatibility
-- It can be removed in a future migration once all code is updated
COMMENT ON COLUMN leagues.admin_id IS 'DEPRECATED: Use league_admins table instead. Kept for backward compatibility.';
