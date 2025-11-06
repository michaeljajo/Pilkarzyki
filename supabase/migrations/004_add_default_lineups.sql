-- Migration: Add default lineups functionality
-- This allows managers to set default lineups that will be used when they don't submit a lineup before the lock date

-- Default lineups table for league competitions
CREATE TABLE default_lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, league_id),
    CONSTRAINT default_lineup_max_players CHECK (array_length(player_ids, 1) <= 3)
);

-- Default lineups table for cup competitions
CREATE TABLE default_cup_lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, cup_id),
    CONSTRAINT default_cup_lineup_max_players CHECK (array_length(player_ids, 1) <= 3)
);

-- Indexes for better query performance
CREATE INDEX idx_default_lineups_manager ON default_lineups(manager_id);
CREATE INDEX idx_default_lineups_league ON default_lineups(league_id);
CREATE INDEX idx_default_cup_lineups_manager ON default_cup_lineups(manager_id);
CREATE INDEX idx_default_cup_lineups_cup ON default_cup_lineups(cup_id);

-- Comments for documentation
COMMENT ON TABLE default_lineups IS 'Default lineups for league competitions - used when manager does not submit lineup before lock date';
COMMENT ON TABLE default_cup_lineups IS 'Default lineups for cup competitions - used when manager does not submit lineup before lock date';
COMMENT ON COLUMN default_lineups.player_ids IS 'Array of player UUIDs (max 3 players)';
COMMENT ON COLUMN default_cup_lineups.player_ids IS 'Array of player UUIDs (max 3 players)';
