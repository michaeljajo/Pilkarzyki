-- =====================================================================
-- Migration 034: Atomic one-for-one player replacement
--
-- The admin tool for the real-world case the swap RPC (migration 025) cannot
-- cover: a player leaves the ten football leagues this game is played with
-- (a transfer to a league outside the pool), so his manager gives him up and
-- takes a free agent instead. Unlike a swap there is no second manager — the
-- outgoing player returns to the pool and an unowned one joins the squad.
--
-- Everything happens in one transaction so a half-applied replacement (squad
-- short of a player, or holding two) can never be observed:
--
--   * ownership + history go through player_transfers, whose existing triggers
--     close the previous active row and sync players.manager_id,
--   * the squad_players junction — which those triggers do NOT touch — is
--     updated here,
--   * the outgoing player is dropped from the manager's still-editable lineups
--     (league and cup) so a departed player cannot be fielded in a gameweek
--     that has not locked yet. Locked and completed gameweeks are untouched:
--     they are history and must keep showing who actually played.
--
-- Default lineups are deliberately left alone. evaluateDefaultLineup() already
-- treats a default containing a player who left the squad as invalid, which
-- re-arms the mandatory-default gate and makes the manager pick again — the
-- right outcome, and better than silently choosing a replacement for them.
--
-- Idempotent: CREATE OR REPLACE.
-- =====================================================================

CREATE OR REPLACE FUNCTION admin_replace_player(
    p_league_id uuid,
    p_manager_id uuid,
    p_player_out uuid,
    p_player_in uuid,
    p_effective_from timestamptz,
    p_created_by uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_mgr_out uuid;
    v_mgr_in uuid;
    v_league_out uuid;
    v_league_in uuid;
    v_squad_id uuid;
BEGIN
    IF p_player_out = p_player_in THEN RAISE EXCEPTION 'SAME_PLAYER'; END IF;

    IF NOT EXISTS (SELECT 1 FROM leagues WHERE id = p_league_id) THEN
        RAISE EXCEPTION 'LEAGUE_NOT_FOUND';
    END IF;

    -- A draft in flight is consuming the same pool; a manual replacement
    -- alongside it would hand out a player the draft still believes is free,
    -- or a squad an extra player on top of its remaining quota. A pre-season
    -- draft merely sitting in 'setup' has not started and does not block —
    -- leagues that were filled from a spreadsheet keep that row forever.
    IF EXISTS (
        SELECT 1 FROM drafts
        WHERE league_id = p_league_id
          AND status <> 'finished'
          AND (kind = 'midseason' OR status = 'live')
    ) THEN
        RAISE EXCEPTION 'DRAFT_IN_PROGRESS';
    END IF;

    -- Lock both player rows to serialize concurrent transfers, then read the
    -- state the checks below rely on from the locked rows.
    SELECT manager_id, league_id INTO v_mgr_out, v_league_out
    FROM players WHERE id = p_player_out FOR UPDATE;
    SELECT manager_id, league_id INTO v_mgr_in, v_league_in
    FROM players WHERE id = p_player_in FOR UPDATE;

    IF v_league_out IS NULL OR v_league_in IS NULL THEN RAISE EXCEPTION 'PLAYER_NOT_FOUND'; END IF;
    IF v_league_out <> p_league_id OR v_league_in <> p_league_id THEN RAISE EXCEPTION 'PLAYER_WRONG_LEAGUE'; END IF;
    IF v_mgr_out IS NULL THEN RAISE EXCEPTION 'PLAYER_UNASSIGNED'; END IF;
    IF v_mgr_out <> p_manager_id THEN RAISE EXCEPTION 'MANAGER_MISMATCH'; END IF;
    IF v_mgr_in IS NOT NULL THEN RAISE EXCEPTION 'PLAYER_TAKEN'; END IF;

    SELECT id INTO v_squad_id FROM squads
    WHERE league_id = p_league_id AND manager_id = p_manager_id;
    IF v_squad_id IS NULL THEN RAISE EXCEPTION 'SQUAD_NOT_FOUND'; END IF;

    -- History + ownership. Inserting an active transfer closes the prior active
    -- row and syncs players.manager_id via the player_transfers triggers.
    INSERT INTO player_transfers (
        player_id, manager_id, league_id, effective_from, effective_until, transfer_type, created_by, notes
    ) VALUES
        (p_player_out, NULL, p_league_id, p_effective_from, NULL, 'swap', p_created_by, p_notes),
        (p_player_in, p_manager_id, p_league_id, p_effective_from, NULL, 'swap', p_created_by, p_notes);

    -- Current-squad junction. Both deletes are unconditional so a stale row for
    -- either player (from an earlier half-applied change) cannot survive.
    DELETE FROM squad_players WHERE player_id IN (p_player_out, p_player_in);
    INSERT INTO squad_players (squad_id, player_id)
    VALUES (v_squad_id, p_player_in)
    ON CONFLICT (squad_id, player_id) DO NOTHING;

    -- Pull the departed player out of every league lineup this manager can
    -- still edit. array_remove strips all occurrences and leaves the rest in
    -- order; the max-3 CHECK only shrinks, so it cannot be violated here.
    UPDATE lineups l
    SET player_ids = array_remove(l.player_ids, p_player_out),
        updated_at = NOW()
    FROM gameweeks g
    WHERE l.gameweek_id = g.id
      AND g.league_id = p_league_id
      AND g.is_completed = FALSE
      AND g.lock_date > NOW()
      AND l.manager_id = p_manager_id
      AND l.is_locked = FALSE
      AND p_player_out = ANY(l.player_ids);

    -- Same for cup lineups, whose lock follows the league gameweek they map to.
    UPDATE cup_lineups cl
    SET player_ids = array_remove(cl.player_ids, p_player_out),
        updated_at = NOW()
    FROM cup_gameweeks cg
    JOIN gameweeks g ON g.id = cg.league_gameweek_id
    WHERE cl.cup_gameweek_id = cg.id
      AND g.league_id = p_league_id
      AND g.is_completed = FALSE
      AND g.lock_date > NOW()
      AND cl.manager_id = p_manager_id
      AND cl.is_locked = FALSE
      AND p_player_out = ANY(cl.player_ids);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION admin_replace_player IS
'Atomically replaces one player in a manager''s squad with a free agent: two swap-type player_transfers rows (outgoing to the pool, incoming to the manager), the squad_players junction, and removal of the outgoing player from the manager''s still-unlocked league and cup lineups.';
