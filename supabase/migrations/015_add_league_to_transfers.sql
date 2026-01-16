-- Migration 015: Add league context to player transfers table
-- This fixes cross-league data leakage in the transfer system
-- By adding league_id, we ensure transfer history is properly isolated per league

-- Step 1: Add league_id column to player_transfers table
ALTER TABLE player_transfers
ADD COLUMN league_id UUID;

-- Step 2: Backfill league_id from players table
-- For each transfer record, get the league_id by finding the league that owns the player
UPDATE player_transfers pt
SET league_id = (
    SELECT l.id
    FROM players p
    JOIN leagues l ON p.league = l.name
    WHERE p.id = pt.player_id
    LIMIT 1
);

-- Step 3: Make league_id NOT NULL now that we've backfilled
ALTER TABLE player_transfers
ALTER COLUMN league_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE player_transfers
ADD CONSTRAINT fk_player_transfers_league
FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;

-- Step 5: Update indexes for better performance with league filtering
-- Drop old indexes that don't include league_id
DROP INDEX IF EXISTS idx_player_transfers_player_id;
DROP INDEX IF EXISTS idx_player_transfers_effective_dates;
DROP INDEX IF EXISTS idx_player_transfers_active;

-- Create new composite indexes that include league_id
CREATE INDEX idx_player_transfers_player_league
ON player_transfers(player_id, league_id);

CREATE INDEX idx_player_transfers_league_dates
ON player_transfers(league_id, effective_from, effective_until);

CREATE INDEX idx_player_transfers_active_by_league
ON player_transfers(player_id, league_id, effective_until)
WHERE effective_until IS NULL;

-- Keep manager_id index as is (still useful for queries by manager)
-- idx_player_transfers_manager_id already exists

-- Step 6: Update get_manager_at_gameweek function to filter by league
CREATE OR REPLACE FUNCTION get_manager_at_gameweek(
    p_player_id UUID,
    p_gameweek_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_manager_id UUID;
    v_gameweek_start TIMESTAMPTZ;
    v_league_id UUID;
BEGIN
    -- Get gameweek start date and league_id
    SELECT start_date, league_id INTO v_gameweek_start, v_league_id
    FROM gameweeks
    WHERE id = p_gameweek_id;

    IF v_gameweek_start IS NULL OR v_league_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Find the transfer that was active during this gameweek in this league
    SELECT manager_id INTO v_manager_id
    FROM player_transfers
    WHERE player_id = p_player_id
      AND league_id = v_league_id  -- NEW: Filter by league
      AND effective_from <= v_gameweek_start
      AND (effective_until IS NULL OR effective_until >= v_gameweek_start)
    ORDER BY effective_from DESC
    LIMIT 1;

    RETURN v_manager_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 7: Update get_current_manager function to require league_id
-- Note: This is a breaking change - we need to update all callers
CREATE OR REPLACE FUNCTION get_current_manager(
    p_player_id UUID,
    p_league_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_manager_id UUID;
BEGIN
    SELECT manager_id INTO v_manager_id
    FROM player_transfers
    WHERE player_id = p_player_id
      AND league_id = p_league_id  -- NEW: Filter by league
      AND effective_until IS NULL
    LIMIT 1;

    RETURN v_manager_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 8: Update sync_player_manager_id trigger function
-- No changes needed - it updates based on player_id which is already league-specific

-- Step 9: League consistency is now enforced at the application level
-- PostgreSQL doesn't support subqueries in CHECK constraints, so we rely on:
-- 1. The createPlayerTransfer() function which validates league ownership
-- 2. The foreign key constraint which ensures league_id references a valid league
-- This is sufficient to maintain data integrity

-- Step 10: Create a view for easy debugging of transfer history with league info
CREATE OR REPLACE VIEW player_transfers_with_league AS
SELECT
    pt.*,
    l.name as league_name,
    p.name as player_name,
    p.surname as player_surname,
    m.first_name || ' ' || m.last_name as manager_name
FROM player_transfers pt
JOIN leagues l ON pt.league_id = l.id
JOIN players p ON pt.player_id = p.id
LEFT JOIN users m ON pt.manager_id = m.id
ORDER BY pt.effective_from DESC;

COMMENT ON VIEW player_transfers_with_league IS
'Convenient view for debugging transfer history with human-readable league and player names';
