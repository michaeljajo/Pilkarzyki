-- Migration 014: Add player transfers table for mid-season draft support
-- This migration preserves historical player-manager relationships to ensure
-- past results and goals are attributed to the correct manager at the time

-- Create transfer type enum
CREATE TYPE transfer_type AS ENUM ('initial', 'draft', 'swap');

-- Player transfers table tracks historical player-manager assignments
CREATE TABLE player_transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for unassigned players
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,  -- NULL for current/active assignment
    transfer_type transfer_type NOT NULL DEFAULT 'initial',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- Admin who created the transfer
    notes TEXT  -- Optional notes about the transfer
);

-- Indexes for performance
CREATE INDEX idx_player_transfers_player_id ON player_transfers(player_id);
CREATE INDEX idx_player_transfers_manager_id ON player_transfers(manager_id);
CREATE INDEX idx_player_transfers_effective_dates ON player_transfers(effective_from, effective_until);
CREATE INDEX idx_player_transfers_active ON player_transfers(player_id, effective_until) WHERE effective_until IS NULL;

-- Constraint: No overlapping transfer periods for the same player
-- This ensures data integrity by preventing conflicting assignments
CREATE UNIQUE INDEX idx_player_transfers_no_overlap
ON player_transfers (player_id, effective_from, effective_until)
WHERE effective_until IS NOT NULL;

-- Only one active transfer per player (where effective_until IS NULL)
CREATE UNIQUE INDEX idx_player_transfers_one_active
ON player_transfers (player_id)
WHERE effective_until IS NULL;

-- Helper function to get manager for a player at a specific gameweek
-- Returns the manager_id who owned the player during that gameweek
-- Returns NULL if player was unassigned or no transfer record exists
CREATE OR REPLACE FUNCTION get_manager_at_gameweek(
    p_player_id UUID,
    p_gameweek_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_manager_id UUID;
    v_gameweek_start TIMESTAMPTZ;
BEGIN
    -- Get gameweek start date
    SELECT start_date INTO v_gameweek_start
    FROM gameweeks
    WHERE id = p_gameweek_id;

    IF v_gameweek_start IS NULL THEN
        RETURN NULL;
    END IF;

    -- Find the transfer that was active during this gameweek
    SELECT manager_id INTO v_manager_id
    FROM player_transfers
    WHERE player_id = p_player_id
      AND effective_from <= v_gameweek_start
      AND (effective_until IS NULL OR effective_until >= v_gameweek_start)
    ORDER BY effective_from DESC
    LIMIT 1;

    RETURN v_manager_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current manager for a player
-- Returns the currently active manager_id (where effective_until IS NULL)
CREATE OR REPLACE FUNCTION get_current_manager(p_player_id UUID)
RETURNS UUID AS $$
DECLARE
    v_manager_id UUID;
BEGIN
    SELECT manager_id INTO v_manager_id
    FROM player_transfers
    WHERE player_id = p_player_id
      AND effective_until IS NULL
    LIMIT 1;

    RETURN v_manager_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Migrate existing player-manager relationships to transfer records
-- This preserves current assignments as "initial" transfers
INSERT INTO player_transfers (player_id, manager_id, effective_from, effective_until, transfer_type)
SELECT
    id as player_id,
    manager_id,
    COALESCE(created_at, '2024-01-01'::TIMESTAMPTZ) as effective_from,
    NULL as effective_until,  -- Current assignment (active)
    'initial' as transfer_type
FROM players
WHERE manager_id IS NOT NULL;

-- Also create transfer records for unassigned players (for completeness)
INSERT INTO player_transfers (player_id, manager_id, effective_from, effective_until, transfer_type)
SELECT
    id as player_id,
    NULL as manager_id,
    COALESCE(created_at, '2024-01-01'::TIMESTAMPTZ) as effective_from,
    NULL as effective_until,
    'initial' as transfer_type
FROM players
WHERE manager_id IS NULL;

-- Add trigger to keep players.manager_id in sync with active transfer
-- This maintains backward compatibility with existing code
CREATE OR REPLACE FUNCTION sync_player_manager_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the player's manager_id to match the new active transfer
    IF NEW.effective_until IS NULL THEN
        UPDATE players
        SET manager_id = NEW.manager_id
        WHERE id = NEW.player_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_player_manager_id
AFTER INSERT OR UPDATE ON player_transfers
FOR EACH ROW
EXECUTE FUNCTION sync_player_manager_id();

-- Add trigger to close previous transfer when a new active transfer is created
CREATE OR REPLACE FUNCTION close_previous_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting a new active transfer (effective_until IS NULL)
    IF NEW.effective_until IS NULL THEN
        -- Close any existing active transfer for this player
        UPDATE player_transfers
        SET effective_until = NEW.effective_from - INTERVAL '1 second'
        WHERE player_id = NEW.player_id
          AND id != NEW.id
          AND effective_until IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_close_previous_transfer
BEFORE INSERT ON player_transfers
FOR EACH ROW
EXECUTE FUNCTION close_previous_transfer();

-- Add updated_at trigger for player_transfers
CREATE TRIGGER update_player_transfers_updated_at
BEFORE UPDATE ON player_transfers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add column to track if transfer was processed (for audit/debugging)
ALTER TABLE player_transfers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE player_transfers IS 'Tracks historical player-manager assignments to preserve data integrity across transfers';
COMMENT ON COLUMN player_transfers.effective_from IS 'Date when this assignment becomes effective';
COMMENT ON COLUMN player_transfers.effective_until IS 'Date when this assignment ends (NULL for current assignment)';
COMMENT ON COLUMN player_transfers.transfer_type IS 'Type of transfer: initial (first assignment), draft (mid-season), swap (between managers)';
