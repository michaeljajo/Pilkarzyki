-- Extra Time and Penalty Shootout Schema Migration
-- Adds support for ET lineups, penalty lineups, and ET/penalty scores on cup matches

-- Extra time lineups (same structure as cup_lineups)
CREATE TABLE IF NOT EXISTS cup_et_lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cup_gameweek_id UUID REFERENCES cup_gameweeks(id) ON DELETE CASCADE NOT NULL,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    is_locked BOOLEAN DEFAULT FALSE,
    total_goals INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, cup_gameweek_id),
    CONSTRAINT cup_et_lineup_max_players CHECK (array_length(player_ids, 1) <= 3 OR array_length(player_ids, 1) IS NULL)
);

-- Penalty lineups (5 takers, each scores 0 or 1)
CREATE TABLE IF NOT EXISTS cup_penalty_lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cup_gameweek_id UUID REFERENCES cup_gameweeks(id) ON DELETE CASCADE NOT NULL,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    goals INTEGER[] NOT NULL DEFAULT '{0,0,0,0,0}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, cup_gameweek_id),
    CONSTRAINT cup_penalty_max_takers CHECK (array_length(player_ids, 1) <= 5 OR array_length(player_ids, 1) IS NULL)
);

-- Add ET and penalty score columns to cup_matches
ALTER TABLE cup_matches
    ADD COLUMN IF NOT EXISTS home_et_score INTEGER,
    ADD COLUMN IF NOT EXISTS away_et_score INTEGER,
    ADD COLUMN IF NOT EXISTS home_penalty_score INTEGER,
    ADD COLUMN IF NOT EXISTS away_penalty_score INTEGER;

-- Triggers for updated_at
CREATE TRIGGER update_cup_et_lineups_updated_at
    BEFORE UPDATE ON cup_et_lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cup_penalty_lineups_updated_at
    BEFORE UPDATE ON cup_penalty_lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cup_et_lineups_manager_gameweek
    ON cup_et_lineups(manager_id, cup_gameweek_id);

CREATE INDEX IF NOT EXISTS idx_cup_penalty_lineups_manager_gameweek
    ON cup_penalty_lineups(manager_id, cup_gameweek_id);
