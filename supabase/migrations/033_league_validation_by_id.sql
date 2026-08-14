-- 033_league_validation_by_id.sql
--
-- ALREADY APPLIED to production on 2026-08-14, by hand, during the WNC draft.
-- Recorded here so the repo matches the live database. Do NOT re-run casually:
-- both statements are CREATE OR REPLACE and therefore safe to repeat, but the
-- surrounding audit trail is the point of this file.
--
-- Both league-consistency triggers from 016_add_league_safeguards.sql resolved
-- a player's league by NAME:
--
--     JOIN leagues l ON p.league = l.name
--
-- `leagues.name` has no unique constraint. The WNC league existed twice — the
-- archived 2025/26 season and the current one — so that join returned two rows
-- and `SELECT ... INTO` silently took an arbitrary one. When it took the
-- archived league, the check failed against a perfectly valid player.
--
-- It surfaced twice in one evening, both times in the WNC draft:
--
--   * squad_players: the final pick of the draft is the only one that runs
--     _draft_finalize, so 143 picks succeeded and pick 144 rolled back the
--     whole transaction with "Błąd serwera podczas przetwarzania draftu".
--   * lineups: saving a squad failed with "Cannot add player <uuid> to lineup
--     - belongs to different league".
--
-- 031_players_league_id.sql added `players.league_id`, a real foreign key that
-- cannot be ambiguous. These triggers were never updated to use it. That is
-- what this migration does.
--
-- The NULL guard keeps the previous permissive behaviour: before, a player
-- whose league text matched nothing produced a NULL comparison and passed.
-- Rows predating the league_id backfill therefore still pass rather than
-- suddenly failing validation.
--
-- Renaming the archived league to 'WNC 2025/26' (and its 165 players'
-- denormalised `players.league` text to match) was done alongside this as a
-- data change, not schema, so it is not reproduced here.

-- ---------------------------------------------------------------------------
-- squad_players
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_squad_player_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_squad_league_id UUID;
    v_player_league_id UUID;
BEGIN
    SELECT league_id INTO v_squad_league_id  FROM squads  WHERE id = NEW.squad_id;
    SELECT league_id INTO v_player_league_id FROM players WHERE id = NEW.player_id;

    IF v_player_league_id IS NOT NULL
       AND v_squad_league_id IS DISTINCT FROM v_player_league_id THEN
        RAISE EXCEPTION 'Cannot add player from league % to squad in league %',
            v_player_league_id, v_squad_league_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- lineups
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_lineup_player_league_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_gameweek_league_id UUID;
    v_player_league_id UUID;
    v_player_id UUID;
BEGIN
    SELECT league_id INTO v_gameweek_league_id FROM gameweeks WHERE id = NEW.gameweek_id;

    IF NEW.player_ids IS NOT NULL THEN
        FOR v_player_id IN SELECT unnest(NEW.player_ids)
        LOOP
            SELECT league_id INTO v_player_league_id FROM players WHERE id = v_player_id;

            IF v_player_league_id IS NOT NULL
               AND v_gameweek_league_id IS DISTINCT FROM v_player_league_id THEN
                RAISE EXCEPTION 'Cannot add player % to lineup - belongs to different league', v_player_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Both triggers themselves are unchanged and keep pointing at these functions:
--   trigger_validate_squad_player_league  BEFORE INSERT OR UPDATE ON squad_players
--   (the lineups trigger, likewise, from 016)
