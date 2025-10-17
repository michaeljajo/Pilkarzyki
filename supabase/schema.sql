-- Fantasy Football Database Schema
-- Generated from TypeScript types in src/types/index.ts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (integrates with Clerk)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    max_managers INTEGER DEFAULT 16,
    current_gameweek INTEGER DEFAULT 1,
    season TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    league TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_goals INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squads table (tracks manager's assigned players)
CREATE TABLE squads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, league_id)
);

-- Squad players junction table
CREATE TABLE squad_players (
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    PRIMARY KEY (squad_id, player_id)
);

-- Gameweeks table
CREATE TABLE gameweeks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    lock_date TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, week)
);

-- Lineups table
CREATE TABLE lineups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
    player_ids UUID[] NOT NULL DEFAULT '{}',
    is_locked BOOLEAN DEFAULT FALSE,
    total_goals INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manager_id, gameweek_id),
    CONSTRAINT lineup_max_players CHECK (array_length(player_ids, 1) <= 3)
);

-- Matches table (head-to-head fixtures)
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
    home_manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    away_manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    home_score INTEGER,
    away_score INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results table (individual player performances)
CREATE TABLE results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    goals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gameweek_id, player_id)
);

-- Standings table (pre-calculated league standings)
CREATE TABLE standings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, manager_id)
);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON squads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gameweeks_updated_at BEFORE UPDATE ON gameweeks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_players_manager_id ON players(manager_id);
CREATE INDEX idx_squads_manager_league ON squads(manager_id, league_id);
CREATE INDEX idx_gameweeks_league_week ON gameweeks(league_id, week);
CREATE INDEX idx_lineups_manager_gameweek ON lineups(manager_id, gameweek_id);
CREATE INDEX idx_matches_gameweek ON matches(gameweek_id);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_results_gameweek_player ON results(gameweek_id, player_id);
CREATE INDEX idx_standings_league ON standings(league_id);