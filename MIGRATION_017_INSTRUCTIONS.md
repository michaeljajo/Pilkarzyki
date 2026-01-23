# Migration 017 Application Instructions

## Problem
The database trigger `validate_transfer_league_consistency` is blocking transfer creation for existing players because it uses a JOIN that fails when `players.league` (TEXT) doesn't match a league in the `leagues` table.

## Solution
You need to manually run this SQL in your Supabase SQL Editor:

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run This SQL

Copy and paste the following SQL and click "Run":

```sql
-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_validate_transfer_league ON player_transfers;

-- Update the validation function
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
```

### Step 3: Verify Success
After running the SQL, you should see a success message. Then try uploading your draft file again.

## Why This Fixes The Issue

The old trigger used:
```sql
FROM players p
JOIN leagues l ON p.league = l.name
```

This JOIN fails when the player's league name doesn't exactly match any league name in the database.

The new trigger queries players and leagues separately, avoiding the JOIN issue while still validating that:
1. The player exists
2. The league exists
3. The player's league name matches the target league name

## If You Still Get Errors

If errors persist after applying this migration, please share the error message from the browser console or Network tab so we can diagnose further.
