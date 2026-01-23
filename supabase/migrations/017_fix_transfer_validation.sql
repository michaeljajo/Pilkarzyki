-- Migration 017: Fix transfer validation trigger
-- The previous trigger was too strict and caused failures when player.league didn't match
-- This update makes the validation more robust

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_validate_transfer_league ON player_transfers;

-- Update the validation function to be more lenient
-- Instead of JOINing, we'll validate that both the player and league exist separately
CREATE OR REPLACE FUNCTION validate_transfer_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_player_exists BOOLEAN;
    v_league_exists BOOLEAN;
    v_player_league_name TEXT;
    v_target_league_name TEXT;
BEGIN
    -- Check if player exists and get its league name
    SELECT league
    INTO v_player_league_name
    FROM players
    WHERE id = NEW.player_id;

    v_player_exists := (v_player_league_name IS NOT NULL);

    IF NOT v_player_exists THEN
        RAISE EXCEPTION 'Player % does not exist', NEW.player_id;
    END IF;

    -- Check if league exists and get its name
    SELECT name
    INTO v_target_league_name
    FROM leagues
    WHERE id = NEW.league_id;

    v_league_exists := (v_target_league_name IS NOT NULL);

    IF NOT v_league_exists THEN
        RAISE EXCEPTION 'League % does not exist', NEW.league_id;
    END IF;

    -- Validate that player's league name matches target league name
    -- This ensures we're not transferring players across different leagues
    IF v_player_league_name IS NOT NULL
       AND v_target_league_name IS NOT NULL
       AND v_player_league_name != v_target_league_name THEN
        RAISE EXCEPTION 'Transfer league mismatch: player belongs to league "%" but transfer is for league "%"',
            v_player_league_name, v_target_league_name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_validate_transfer_league
    BEFORE INSERT OR UPDATE ON player_transfers
    FOR EACH ROW
    EXECUTE FUNCTION validate_transfer_league_consistency();

COMMENT ON FUNCTION validate_transfer_league_consistency() IS
'Validates that transfers are created for players in the correct league. Updated to handle TEXT league field properly.';
