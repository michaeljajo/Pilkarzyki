-- Performance Optimization: Add Critical Indexes
-- Created: 2025-10-16
-- Purpose: Improve query performance for frequently-filtered columns

-- Drop indexes if they already exist (idempotent)
DROP INDEX IF EXISTS idx_users_clerk_id;
DROP INDEX IF EXISTS idx_players_league_manager;
DROP INDEX IF EXISTS idx_players_league;
DROP INDEX IF EXISTS idx_squads_league_manager;
DROP INDEX IF EXISTS idx_lineups_manager_gameweek;
DROP INDEX IF EXISTS idx_lineups_gameweek_id;
DROP INDEX IF EXISTS idx_results_gameweek_player;
DROP INDEX IF EXISTS idx_results_gameweek_id;
DROP INDEX IF EXISTS idx_matches_league_gameweek;
DROP INDEX IF EXISTS idx_matches_gameweek_id;
DROP INDEX IF EXISTS idx_gameweeks_league_id;
DROP INDEX IF EXISTS idx_standings_league_id;

-- Users table: clerk_id is filtered on every authenticated request
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- Players table: frequently filtered by league and manager_id
-- Note: 'league' is a text column, not league_id
CREATE INDEX idx_players_league_manager ON players(league, manager_id);
CREATE INDEX idx_players_league ON players(league);

-- Squads table: filtered by league and manager combination
CREATE INDEX idx_squads_league_manager ON squads(league_id, manager_id);

-- Lineups table: filtered by manager and gameweek very frequently
CREATE INDEX idx_lineups_manager_gameweek ON lineups(manager_id, gameweek_id);
CREATE INDEX idx_lineups_gameweek_id ON lineups(gameweek_id);

-- Results table: filtered by gameweek and player_id for scoring
CREATE INDEX idx_results_gameweek_player ON results(gameweek_id, player_id);
CREATE INDEX idx_results_gameweek_id ON results(gameweek_id);

-- Matches table: filtered by league and gameweek for fixtures
CREATE INDEX idx_matches_league_gameweek ON matches(league_id, gameweek_id);
CREATE INDEX idx_matches_gameweek_id ON matches(gameweek_id);

-- Gameweeks table: filtered by league_id
CREATE INDEX idx_gameweeks_league_id ON gameweeks(league_id);

-- Standings table: filtered by league_id
CREATE INDEX idx_standings_league_id ON standings(league_id);

-- Note: Cup table indexes already exist in migration 002_add_cup_tournament.sql
-- No additional cup indexes needed here

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
