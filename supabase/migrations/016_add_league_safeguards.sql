-- Migration 016: Add safeguards for league data isolation
-- Ensures players and transfers cannot be mixed between leagues

-- 1. Add trigger to validate transfer-player league consistency
-- This trigger ensures that when a transfer is created, the player belongs to the correct league
CREATE OR REPLACE FUNCTION validate_transfer_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_player_league_id UUID;
    v_player_league_name TEXT;
BEGIN
    -- Get the league that owns this player
    SELECT l.id, l.name INTO v_player_league_id, v_player_league_name
    FROM players p
    JOIN leagues l ON p.league = l.name
    WHERE p.id = NEW.player_id;

    -- Check if player exists
    IF v_player_league_id IS NULL THEN
        RAISE EXCEPTION 'Player % does not exist or has no league', NEW.player_id;
    END IF;

    -- Check if the transfer's league matches the player's league
    IF v_player_league_id != NEW.league_id THEN
        RAISE EXCEPTION 'Transfer league mismatch: player belongs to league %, but transfer is for league %',
            v_player_league_name, NEW.league_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_validate_transfer_league ON player_transfers;
CREATE TRIGGER trigger_validate_transfer_league
    BEFORE INSERT OR UPDATE ON player_transfers
    FOR EACH ROW
    EXECUTE FUNCTION validate_transfer_league_consistency();

-- 2. Add function to validate squad-player league consistency
CREATE OR REPLACE FUNCTION validate_squad_player_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_squad_league_id UUID;
    v_player_league_name TEXT;
    v_player_league_id UUID;
BEGIN
    -- Get the squad's league
    SELECT league_id INTO v_squad_league_id
    FROM squads
    WHERE id = NEW.squad_id;

    -- Get the player's league
    SELECT l.id, l.name INTO v_player_league_id, v_player_league_name
    FROM players p
    JOIN leagues l ON p.league = l.name
    WHERE p.id = NEW.player_id;

    -- Check if player belongs to same league as squad
    IF v_squad_league_id != v_player_league_id THEN
        RAISE EXCEPTION 'Cannot add player from league % to squad in different league',
            v_player_league_name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for squad_players
DROP TRIGGER IF EXISTS trigger_validate_squad_player_league ON squad_players;
CREATE TRIGGER trigger_validate_squad_player_league
    BEFORE INSERT OR UPDATE ON squad_players
    FOR EACH ROW
    EXECUTE FUNCTION validate_squad_player_league_consistency();

-- 3. Add function to validate lineup-player league consistency
CREATE OR REPLACE FUNCTION validate_lineup_player_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_gameweek_league_id UUID;
    v_player_league_id UUID;
    v_player_id UUID;
BEGIN
    -- Get the gameweek's league
    SELECT league_id INTO v_gameweek_league_id
    FROM gameweeks
    WHERE id = NEW.gameweek_id;

    -- Check each player in the lineup
    IF NEW.player_ids IS NOT NULL THEN
        FOR v_player_id IN SELECT unnest(NEW.player_ids)
        LOOP
            -- Get the player's league
            SELECT l.id INTO v_player_league_id
            FROM players p
            JOIN leagues l ON p.league = l.name
            WHERE p.id = v_player_id;

            -- Check if player belongs to same league as gameweek
            IF v_gameweek_league_id != v_player_league_id THEN
                RAISE EXCEPTION 'Cannot add player % to lineup - belongs to different league', v_player_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for lineups
DROP TRIGGER IF EXISTS trigger_validate_lineup_player_league ON lineups;
CREATE TRIGGER trigger_validate_lineup_player_league
    BEFORE INSERT OR UPDATE ON lineups
    FOR EACH ROW
    EXECUTE FUNCTION validate_lineup_player_league_consistency();

-- 4. Add comments to document the safeguards
COMMENT ON TRIGGER trigger_validate_transfer_league ON player_transfers IS
    'Ensures transfers can only be created for players in the same league';

COMMENT ON TRIGGER trigger_validate_squad_player_league ON squad_players IS
    'Prevents adding players from different leagues to a squad';

COMMENT ON TRIGGER trigger_validate_lineup_player_league ON lineups IS
    'Validates that all players in a lineup belong to the gameweek''s league';

COMMENT ON COLUMN player_transfers.league_id IS
    'League this transfer belongs to - MUST match the player''s league. Enforced by trigger.';

-- 5. Create a view to help identify any existing cross-league data issues
CREATE OR REPLACE VIEW cross_league_data_issues AS
-- Check for transfers in wrong league
SELECT
    'transfer' as issue_type,
    pt.id as record_id,
    p.name || ' ' || p.surname as player_name,
    p.league as player_league,
    l.name as transfer_league,
    'Player belongs to ' || p.league || ' but transfer is in ' || l.name as description
FROM player_transfers pt
JOIN players p ON pt.player_id = p.id
JOIN leagues l ON pt.league_id = l.id
WHERE p.league != l.name

UNION ALL

-- Check for squad_players in wrong league
SELECT
    'squad_player' as issue_type,
    sp.player_id as record_id,
    p.name || ' ' || p.surname as player_name,
    p.league as player_league,
    l.name as squad_league,
    'Player belongs to ' || p.league || ' but squad is in ' || l.name as description
FROM squad_players sp
JOIN players p ON sp.player_id = p.id
JOIN squads s ON sp.squad_id = s.id
JOIN leagues l ON s.league_id = l.id
WHERE p.league != l.name;

COMMENT ON VIEW cross_league_data_issues IS
    'Identifies any cross-league data inconsistencies. Should always return 0 rows.';
