-- =====================================================================
-- Migration 025: Atomic manager-to-manager player swap
--
-- A rare admin tool: exchange one player between two managers in a single
-- transaction so a partial swap can never corrupt squads.
--
-- Ownership + history are driven by player_transfers (its existing triggers
-- close the previous active row and sync players.manager_id). This function
-- adds the one thing those triggers do NOT touch — the squad_players junction
-- used for current-squad reads — and does everything atomically.
--
-- Idempotent: CREATE OR REPLACE.
-- =====================================================================

CREATE OR REPLACE FUNCTION admin_swap_players(
    p_league_id uuid,
    p_player_a uuid,
    p_player_b uuid,
    p_effective_from timestamptz,
    p_created_by uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_league_name TEXT;
    v_mgr_a uuid;
    v_mgr_b uuid;
    v_league_a TEXT;
    v_league_b TEXT;
    v_squad_a uuid;
    v_squad_b uuid;
BEGIN
    IF p_player_a = p_player_b THEN RAISE EXCEPTION 'SAME_PLAYER'; END IF;

    SELECT name INTO v_league_name FROM leagues WHERE id = p_league_id;
    IF v_league_name IS NULL THEN RAISE EXCEPTION 'LEAGUE_NOT_FOUND'; END IF;

    -- Lock both player rows to serialize concurrent swaps and read current owners.
    SELECT manager_id, league INTO v_mgr_a, v_league_a FROM players WHERE id = p_player_a FOR UPDATE;
    SELECT manager_id, league INTO v_mgr_b, v_league_b FROM players WHERE id = p_player_b FOR UPDATE;

    IF v_league_a IS NULL OR v_league_b IS NULL THEN RAISE EXCEPTION 'PLAYER_NOT_FOUND'; END IF;
    IF v_league_a <> v_league_name OR v_league_b <> v_league_name THEN RAISE EXCEPTION 'PLAYER_WRONG_LEAGUE'; END IF;
    IF v_mgr_a IS NULL OR v_mgr_b IS NULL THEN RAISE EXCEPTION 'PLAYER_UNASSIGNED'; END IF;
    IF v_mgr_a = v_mgr_b THEN RAISE EXCEPTION 'SAME_MANAGER'; END IF;

    SELECT id INTO v_squad_a FROM squads WHERE league_id = p_league_id AND manager_id = v_mgr_a;
    SELECT id INTO v_squad_b FROM squads WHERE league_id = p_league_id AND manager_id = v_mgr_b;
    IF v_squad_a IS NULL OR v_squad_b IS NULL THEN RAISE EXCEPTION 'SQUAD_NOT_FOUND'; END IF;

    -- History + ownership: inserting an active transfer closes the prior active
    -- row and syncs players.manager_id via existing player_transfers triggers.
    INSERT INTO player_transfers (player_id, manager_id, league_id, effective_from, effective_until, transfer_type, created_by)
    VALUES
        (p_player_a, v_mgr_b, p_league_id, p_effective_from, NULL, 'swap', p_created_by),
        (p_player_b, v_mgr_a, p_league_id, p_effective_from, NULL, 'swap', p_created_by);

    -- Current-squad junction (not touched by the transfer triggers): move each
    -- player to the other squad. Rebuild both rows to be robust to any prior gaps.
    DELETE FROM squad_players WHERE player_id IN (p_player_a, p_player_b);
    INSERT INTO squad_players (squad_id, player_id)
    VALUES (v_squad_b, p_player_a), (v_squad_a, p_player_b)
    ON CONFLICT (squad_id, player_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION admin_swap_players IS
'Atomically swaps one player between two managers: two swap-type player_transfers rows plus the squad_players junction update, in a single transaction.';
