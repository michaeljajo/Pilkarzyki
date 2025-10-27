-- ============================================
-- DATABASE PURGE SCRIPT
-- ============================================
-- This script removes ALL data from the database
-- while preserving the schema structure.
--
-- WARNING: This is IRREVERSIBLE!
-- ============================================

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

BEGIN;

-- Step 1: Clear Cup Tournament Data (delete in correct order due to foreign keys)
DELETE FROM cup_group_standings;
DELETE FROM cup_lineups;
DELETE FROM cup_matches;
DELETE FROM cup_gameweeks;
DELETE FROM cup_groups;
DELETE FROM cups;

-- Step 2: Clear League Data
DELETE FROM results;
DELETE FROM lineups;
DELETE FROM matches;
DELETE FROM gameweeks;
DELETE FROM players;
DELETE FROM squads;
DELETE FROM leagues;

-- Step 3: Clear User Data (this will cascade to any remaining references)
DELETE FROM users;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- Verify all tables are empty
SELECT 'cups' as table_name, COUNT(*) as row_count FROM cups
UNION ALL
SELECT 'cup_groups', COUNT(*) FROM cup_groups
UNION ALL
SELECT 'cup_gameweeks', COUNT(*) FROM cup_gameweeks
UNION ALL
SELECT 'cup_matches', COUNT(*) FROM cup_matches
UNION ALL
SELECT 'cup_lineups', COUNT(*) FROM cup_lineups
UNION ALL
SELECT 'cup_group_standings', COUNT(*) FROM cup_group_standings
UNION ALL
SELECT 'results', COUNT(*) FROM results
UNION ALL
SELECT 'lineups', COUNT(*) FROM lineups
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'gameweeks', COUNT(*) FROM gameweeks
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'squads', COUNT(*) FROM squads
UNION ALL
SELECT 'leagues', COUNT(*) FROM leagues
UNION ALL
SELECT 'users', COUNT(*) FROM users
ORDER BY table_name;
