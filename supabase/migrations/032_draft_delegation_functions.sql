-- =====================================================================
-- Migration 032: Draft delegation functions (zastępstwa)
--
-- 028 committed the `draft_delegations` TABLE, which was created by hand in
-- production on 2026-07-31. The functions that actually make delegation work
-- were written on feat/draft-ux-overhaul and never landed, so the table has
-- been sitting live with nothing reading or writing it. This file supplies
-- them, reconstructed from that branch's 028.
--
-- ---------------------------------------------------------------------
-- ALREADY APPLIED IN PRODUCTION — fully verified 2026-08-14.
--
-- Do NOT run it. Every statement below is a confirmed no-op against the live
-- database. Like the table in 028, all of this was created by hand on
-- 2026-07-31 and never committed; this file exists so a fresh environment
-- rebuilt from migrations matches production, not to be applied.
--
-- How each part was verified:
--   * draft_set_delegation, draft_clear_delegation — called with an all-zero
--     draft id, which raises DRAFT_NOT_FOUND before writing anything. Both
--     returned that, so both exist.
--   * draft_picks.picked_by_user_id — selected successfully.
--   * draft_make_pick — `SELECT prosrc FROM pg_proc WHERE proname =
--     'draft_make_pick'` compared against the body below: byte-identical,
--     delegate branch included.
--
-- Every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE), so
-- running it anyway is harmless — but there is nothing for it to do.
-- ---------------------------------------------------------------------
--
-- Applies to BOTH draft kinds — the table is keyed by draft_id, and the
-- authorisation lives in draft_make_pick, which the pre-season and mid-season
-- routes already share.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Audit column
-- ---------------------------------------------------------------------

-- Who physically confirmed the pick, when it was not the squad's own manager.
-- NULL for ordinary self-picks and for admin picks — the pick itself always
-- belongs to the delegator, so squad_id/manager_id are untouched.
ALTER TABLE draft_picks
  ADD COLUMN IF NOT EXISTS picked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------

-- Manager pick, now delegation-aware. Unchanged for the common case: the
-- caller must own the squad on the clock. A registered delegate of that squad
-- is additionally allowed, and is recorded in picked_by_user_id.
--
-- Delegation is deliberately NOT transitive: only a delegation whose
-- delegator_squad_id is the squad ON THE CLOCK authorises the pick, so a
-- delegate's own delegate never inherits the chain.
CREATE OR REPLACE FUNCTION draft_make_pick(
    p_draft_id uuid,
    p_user_internal_id uuid,
    p_player_id uuid
) RETURNS drafts AS $$
DECLARE
    d drafts;
    v_squad_id uuid;
    v_manager_id uuid;
    v_delegated boolean := FALSE;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'live' THEN RAISE EXCEPTION 'DRAFT_NOT_LIVE'; END IF;

    v_squad_id := (d.current_queue->>0)::uuid;
    IF v_squad_id IS NULL THEN RAISE EXCEPTION 'NO_TURN'; END IF;

    SELECT manager_id INTO v_manager_id FROM squads WHERE id = v_squad_id;
    IF v_manager_id IS DISTINCT FROM p_user_internal_id THEN
        IF EXISTS (
            SELECT 1 FROM draft_delegations
            WHERE draft_id = p_draft_id
              AND delegator_squad_id = v_squad_id
              AND delegate_user_id = p_user_internal_id
        ) THEN
            v_delegated := TRUE;
        ELSE
            RAISE EXCEPTION 'NOT_YOUR_TURN';
        END IF;
    END IF;

    PERFORM _draft_commit_pick(p_draft_id, v_squad_id, v_manager_id, p_player_id);

    IF v_delegated THEN
        UPDATE draft_picks
        SET picked_by_user_id = p_user_internal_id
        WHERE draft_id = p_draft_id AND player_id = p_player_id;
    END IF;

    SELECT * INTO d FROM drafts WHERE id = p_draft_id;
    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Nominate a delegate. Validates league membership on both sides so an admin
-- cannot wire two unrelated leagues together, and re-nominating simply
-- replaces the current delegate.
CREATE OR REPLACE FUNCTION draft_set_delegation(
    p_draft_id uuid,
    p_squad_id uuid,
    p_delegate_user_id uuid,
    p_created_by uuid
) RETURNS void AS $$
DECLARE
    d drafts;
    v_manager_id uuid;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status = 'finished' THEN RAISE EXCEPTION 'DRAFT_FINISHED'; END IF;

    SELECT manager_id INTO v_manager_id
    FROM squads WHERE id = p_squad_id AND league_id = d.league_id;
    IF v_manager_id IS NULL THEN RAISE EXCEPTION 'SQUAD_NOT_IN_LEAGUE'; END IF;

    IF v_manager_id = p_delegate_user_id THEN RAISE EXCEPTION 'SELF_DELEGATION'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM squads WHERE league_id = d.league_id AND manager_id = p_delegate_user_id
    ) THEN
        RAISE EXCEPTION 'DELEGATE_NOT_IN_LEAGUE';
    END IF;

    INSERT INTO draft_delegations (draft_id, delegator_squad_id, delegate_user_id, created_by)
    VALUES (p_draft_id, p_squad_id, p_delegate_user_id, p_created_by)
    ON CONFLICT (draft_id, delegator_squad_id) DO UPDATE
        SET delegate_user_id = EXCLUDED.delegate_user_id,
            created_by = EXCLUDED.created_by,
            created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Revoke a delegation (the manager takes his picks back, or an admin clears it).
CREATE OR REPLACE FUNCTION draft_clear_delegation(
    p_draft_id uuid,
    p_squad_id uuid
) RETURNS void AS $$
BEGIN
    DELETE FROM draft_delegations
    WHERE draft_id = p_draft_id AND delegator_squad_id = p_squad_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------

-- The board subscribes to delegation changes so a stand-in nominated mid-draft
-- shows up on every open screen without a reload.
--
-- SELECT only, deliberately: 028 notes there is no insert/update/delete policy
-- on this table, so writes go exclusively through the service-role client in
-- the API route. The branch this was reconstructed from granted ALL; that
-- would widen the surface for no gain, since RLS blocks those writes anyway.
GRANT SELECT ON draft_delegations TO anon, authenticated;

ALTER TABLE draft_delegations REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'draft_delegations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE draft_delegations;
    END IF;
END $$;
