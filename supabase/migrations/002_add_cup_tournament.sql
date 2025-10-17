-- Cup Tournament Schema Migration
-- Adds tables for cup tournament functionality alongside existing league system

-- Cups table (one cup per league)
CREATE TABLE cups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'group_stage' CHECK (stage IN ('group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final')),
    is_active BOOLEAN DEFAULT TRUE,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cup groups table (assigns managers to groups)
CREATE TABLE cup_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    group_name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cup_id, manager_id), -- Each manager can only be in one group per cup
    UNIQUE(cup_id, group_name, manager_id) -- Prevent duplicate group assignments
);

-- Cup gameweeks (maps cup gameweeks to league gameweeks for timing)
CREATE TABLE cup_gameweeks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    league_gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE NOT NULL,
    cup_week INTEGER NOT NULL, -- Cup's own week numbering
    stage TEXT NOT NULL CHECK (stage IN ('group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final')),
    leg INTEGER DEFAULT 1 CHECK (leg IN (1, 2)), -- For two-leg ties (1 or 2), finals are leg 1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cup_id, cup_week),
    UNIQUE(cup_id, league_gameweek_id, stage, leg) -- Prevent duplicate gameweek mappings
);

-- Cup matches (group stage and knockout matches)
CREATE TABLE cup_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    cup_gameweek_id UUID REFERENCES cup_gameweeks(id) ON DELETE CASCADE NOT NULL,
    home_manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    away_manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final')),
    leg INTEGER DEFAULT 1 CHECK (leg IN (1, 2)), -- For two-leg ties
    group_name TEXT, -- Only for group stage matches (e.g., 'A', 'B')
    home_score INTEGER,
    away_score INTEGER,
    home_aggregate_score INTEGER, -- For knockout stages (sum of both legs)
    away_aggregate_score INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Winner of the match/tie
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: group matches must have group_name
    CONSTRAINT group_stage_has_group CHECK (
        (stage = 'group_stage' AND group_name IS NOT NULL) OR
        (stage != 'group_stage' AND group_name IS NULL)
    )
);

-- Cup lineups (separate from league lineups)
CREATE TABLE cup_lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cup_gameweek_id UUID REFERENCES cup_gameweeks(id) ON DELETE CASCADE NOT NULL,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    is_locked BOOLEAN DEFAULT FALSE,
    total_goals INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, cup_gameweek_id),
    CONSTRAINT cup_lineup_max_players CHECK (array_length(player_ids, 1) <= 3)
);

-- Cup group standings (for group stage)
CREATE TABLE cup_group_standings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    group_name TEXT NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0, -- Position within the group
    qualified BOOLEAN DEFAULT FALSE, -- Top 2 qualify
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cup_id, group_name, manager_id)
);

-- Update triggers for updated_at columns
CREATE TRIGGER update_cups_updated_at BEFORE UPDATE ON cups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cup_matches_updated_at BEFORE UPDATE ON cup_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cup_lineups_updated_at BEFORE UPDATE ON cup_lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cup_group_standings_updated_at BEFORE UPDATE ON cup_group_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_cups_league_id ON cups(league_id);
CREATE INDEX idx_cup_groups_cup_id ON cup_groups(cup_id);
CREATE INDEX idx_cup_groups_manager_id ON cup_groups(manager_id);
CREATE INDEX idx_cup_gameweeks_cup_id ON cup_gameweeks(cup_id);
CREATE INDEX idx_cup_gameweeks_league_gameweek_id ON cup_gameweeks(league_gameweek_id);
CREATE INDEX idx_cup_matches_cup_gameweek_id ON cup_matches(cup_gameweek_id);
CREATE INDEX idx_cup_matches_cup_id ON cup_matches(cup_id);
CREATE INDEX idx_cup_matches_stage ON cup_matches(stage);
CREATE INDEX idx_cup_lineups_manager_cup_gameweek ON cup_lineups(manager_id, cup_gameweek_id);
CREATE INDEX idx_cup_group_standings_cup_group ON cup_group_standings(cup_id, group_name);

-- Comments for documentation
COMMENT ON TABLE cups IS 'Cup tournaments tied to leagues';
COMMENT ON TABLE cup_groups IS 'Manager assignments to cup groups';
COMMENT ON TABLE cup_gameweeks IS 'Cup gameweeks mapped to league gameweeks for timing';
COMMENT ON TABLE cup_matches IS 'Cup matches for group stage and knockout rounds';
COMMENT ON TABLE cup_lineups IS 'Manager lineups for cup matches (separate from league)';
COMMENT ON TABLE cup_group_standings IS 'Group stage standings';
COMMENT ON COLUMN cup_matches.leg IS '1 or 2 for two-leg ties (finals always use leg 1)';
COMMENT ON COLUMN cup_matches.home_aggregate_score IS 'Sum of home scores across both legs for knockout ties';
COMMENT ON COLUMN cup_group_standings.qualified IS 'Top 2 in each group qualify for knockouts';
