-- Migration: Add lineup history tables for audit logging
-- This tracks all lineup changes with timestamps for both league and cup competitions

-- League lineup history table
CREATE TABLE IF NOT EXISTS lineup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gameweek_id UUID NOT NULL REFERENCES gameweeks(id) ON DELETE CASCADE,
  player_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_admin BOOLEAN DEFAULT FALSE,
  admin_creator_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Cup lineup history table
CREATE TABLE IF NOT EXISTS cup_lineup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cup_gameweek_id UUID NOT NULL REFERENCES cup_gameweeks(id) ON DELETE CASCADE,
  player_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lineup_history_manager_gameweek
  ON lineup_history(manager_id, gameweek_id);
CREATE INDEX IF NOT EXISTS idx_lineup_history_created_at
  ON lineup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cup_lineup_history_manager_gameweek
  ON cup_lineup_history(manager_id, cup_gameweek_id);
CREATE INDEX IF NOT EXISTS idx_cup_lineup_history_created_at
  ON cup_lineup_history(created_at DESC);

-- Enable RLS
ALTER TABLE lineup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_lineup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lineup_history
CREATE POLICY "Users can view their own lineup history"
  ON lineup_history FOR SELECT
  USING (auth.uid()::text IN (
    SELECT clerk_id FROM users WHERE id = manager_id
  ));

CREATE POLICY "Admins can view all lineup history"
  ON lineup_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = auth.uid()::text AND is_admin = true
    )
  );

-- RLS Policies for cup_lineup_history
CREATE POLICY "Users can view their own cup lineup history"
  ON cup_lineup_history FOR SELECT
  USING (auth.uid()::text IN (
    SELECT clerk_id FROM users WHERE id = manager_id
  ));

CREATE POLICY "Admins can view all cup lineup history"
  ON cup_lineup_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = auth.uid()::text AND is_admin = true
    )
  );

-- Comment tables
COMMENT ON TABLE lineup_history IS 'Audit log of all league lineup changes with timestamps';
COMMENT ON TABLE cup_lineup_history IS 'Audit log of all cup lineup changes with timestamps';
