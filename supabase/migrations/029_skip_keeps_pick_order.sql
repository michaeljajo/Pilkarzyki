-- =====================================================================
-- Migration 029: "Pomiń kolejkę" preserves the order and is repaid later
--
-- Previously draft_skip moved the on-the-clock squad to the END of the
-- current round, so the manager still picked that round — just last. That
-- silently reorders the draft, which matters because pick order is the one
-- thing managers agree on up front.
--
-- New behaviour (pre-season):
--   * a skip does NOT reorder anything — the queue is popped and nothing is
--     re-appended, so everyone keeps their slot;
--   * the skipped pick is recorded as a debt and repaid AFTER the last
--     regular round. There are as many catch-up rounds as the largest number
--     of picks any single manager owes, and each catch-up round runs through
--     pick_order keeping only the managers who still owe something.
--   * nobody ends up short: a manager skipped twice simply takes those two
--     picks in catch-up rounds 1 and 2.
--
-- Debts are tracked in drafts.skip_debts (squad_id -> owed picks), the same
-- shape as pick_quotas. A pick made during a catch-up round repays one. Being
-- skipped again *during* a catch-up round does not double the debt — the
-- existing one simply stays owed.
--
-- Mid-season needs none of this: its quota model already gives the pick back,
-- because pick_quotas is only decremented on an actual pick and each round is
-- rebuilt from the squads that still have quota left. So a mid-season skip
-- just rolls into the next round automatically.
--
-- Idempotent (IF NOT EXISTS / CREATE OR REPLACE) and safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------

-- Owed picks per squad, for the pre-season catch-up rounds.
ALTER TABLE drafts
    ADD COLUMN IF NOT EXISTS skip_debts JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Undo restores the exact pre-pick state; debts are part of that state now.
-- NULL on rows written before this migration — callers fall back to the
-- draft's current map in that case.
ALTER TABLE draft_picks
    ADD COLUMN IF NOT EXISTS skip_debts_before JSONB;

COMMENT ON COLUMN drafts.skip_debts IS
  'Pre-season only: squad_id -> number of skipped picks still owed, repaid in catch-up rounds after total_rounds.';

-- ---------------------------------------------------------------------
-- Skip
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION draft_skip(p_draft_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_queue JSONB;
    v_new_round INTEGER;
    v_debts JSONB;
    v_skipped TEXT;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'live' THEN RAISE EXCEPTION 'DRAFT_NOT_LIVE'; END IF;
    IF jsonb_array_length(d.current_queue) = 0 THEN RAISE EXCEPTION 'NO_TURN'; END IF;

    v_skipped := d.current_queue->>0;

    -- Drop this squad's turn. Nothing is re-appended: that is the whole point.
    v_queue := d.current_queue - 0;
    v_new_round := d.round;

    -- ---- Mid-season: quota-driven, no debt bookkeeping needed ----
    IF d.kind = 'midseason' THEN
        IF jsonb_array_length(v_queue) = 0 THEN
            v_new_round := d.round + 1;
            -- Quotas are untouched by a skip, so the skipped squad is still
            -- here as long as it had picks left.
            SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb) INTO v_queue
            FROM jsonb_array_elements_text(d.pick_order) WITH ORDINALITY AS t(elem, ord)
            WHERE COALESCE((d.pick_quotas->>elem)::int, 0) > 0;

            IF jsonb_array_length(v_queue) = 0 THEN
                UPDATE drafts
                SET current_queue = '[]'::jsonb,
                    status = 'finished', finished_at = NOW(), updated_at = NOW()
                WHERE id = p_draft_id
                RETURNING * INTO d;
                PERFORM _draft_finalize_midseason(p_draft_id);
                RETURN d;
            END IF;
        END IF;

        UPDATE drafts
        SET current_queue = v_queue, round = v_new_round, updated_at = NOW()
        WHERE id = p_draft_id
        RETURNING * INTO d;
        RETURN d;
    END IF;

    -- ---- Pre-season: record the debt, then roll the round over ----
    v_debts := COALESCE(d.skip_debts, '{}'::jsonb);

    -- Only a regular round creates a NEW debt. A manager skipped again during
    -- a catch-up round has not lost an extra pick — he simply still owes the
    -- one he was already there to take.
    IF d.round <= d.total_rounds THEN
        v_debts := jsonb_set(
            v_debts,
            ARRAY[v_skipped],
            to_jsonb(COALESCE((v_debts->>v_skipped)::int, 0) + 1)
        );
    END IF;

    IF jsonb_array_length(v_queue) = 0 THEN
        v_new_round := d.round + 1;
        IF v_new_round > d.total_rounds THEN
            -- Catch-up round: original order, debtors only.
            -- WITH ORDINALITY + explicit ORDER BY: the catch-up round must run
            -- in the original draft order, so that is stated rather than relied
            -- upon as an artefact of how the set-returning function is scanned.
            SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb) INTO v_queue
            FROM jsonb_array_elements_text(d.pick_order) WITH ORDINALITY AS t(elem, ord)
            WHERE COALESCE((v_debts->>elem)::int, 0) > 0;

            IF jsonb_array_length(v_queue) = 0 THEN
                UPDATE drafts
                SET current_queue = '[]'::jsonb, skip_debts = v_debts, round = d.round,
                    status = 'finished', finished_at = NOW(), updated_at = NOW()
                WHERE id = p_draft_id
                RETURNING * INTO d;
                PERFORM _draft_finalize(p_draft_id);
                RETURN d;
            END IF;
        ELSE
            v_queue := d.pick_order;   -- next regular round, original order
        END IF;
    END IF;

    UPDATE drafts
    SET current_queue = v_queue, skip_debts = v_debts, round = v_new_round, updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;
    RETURN d;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION draft_skip(uuid) IS
  'Admin skip: the squad forfeits this turn without changing pick order. Pre-season debts are repaid in catch-up rounds after total_rounds.';

-- ---------------------------------------------------------------------
-- Commit a pick — pre-season branch now debt-aware
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _draft_commit_pick(
    p_draft_id uuid,
    p_squad_id uuid,
    p_manager_id uuid,
    p_player_id uuid
) RETURNS void AS $$
DECLARE
    d drafts;
    v_league_name TEXT;
    v_player_league TEXT;
    v_player_manager uuid;
    v_next_pick_number INTEGER;
    v_queue JSONB;
    v_new_round INTEGER;
    v_quotas JSONB;
    v_remaining INTEGER;
    v_debts JSONB;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id;  -- already locked by caller

    SELECT l.name INTO v_league_name FROM leagues l WHERE l.id = d.league_id;
    SELECT p.league, p.manager_id INTO v_player_league, v_player_manager FROM players p WHERE p.id = p_player_id;
    IF v_player_league IS NULL THEN RAISE EXCEPTION 'PLAYER_NOT_FOUND'; END IF;
    IF v_player_league <> v_league_name THEN RAISE EXCEPTION 'PLAYER_WRONG_LEAGUE'; END IF;

    -- Mid-season: only pool (unassigned) players may be picked.
    IF d.kind = 'midseason' AND v_player_manager IS NOT NULL THEN
        RAISE EXCEPTION 'PLAYER_NOT_AVAILABLE';
    END IF;

    IF EXISTS (SELECT 1 FROM draft_picks WHERE draft_id = p_draft_id AND player_id = p_player_id) THEN
        RAISE EXCEPTION 'PLAYER_TAKEN';
    END IF;

    SELECT COALESCE(MAX(pick_number), 0) + 1 INTO v_next_pick_number
    FROM draft_picks WHERE draft_id = p_draft_id;

    INSERT INTO draft_picks (
        draft_id, squad_id, manager_id, player_id, round, pick_number,
        round_before, queue_before, skip_debts_before
    ) VALUES (
        p_draft_id, p_squad_id, p_manager_id, p_player_id, d.round, v_next_pick_number,
        d.round, d.current_queue, COALESCE(d.skip_debts, '{}'::jsonb)
    );

    v_queue := d.current_queue - 0;   -- pop the squad that just picked
    v_new_round := d.round;

    IF d.kind = 'midseason' THEN
        -- Decrement this squad's remaining quota.
        v_remaining := COALESCE((d.pick_quotas->>p_squad_id::text)::int, 0) - 1;
        v_quotas := jsonb_set(d.pick_quotas, ARRAY[p_squad_id::text], to_jsonb(GREATEST(v_remaining, 0)));

        IF jsonb_array_length(v_queue) = 0 THEN
            v_new_round := d.round + 1;
            -- Rebuild next round from pick_order, keeping only squads with quota left.
            SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb) INTO v_queue
            FROM jsonb_array_elements_text(d.pick_order) WITH ORDINALITY AS t(elem, ord)
            WHERE COALESCE((v_quotas->>elem)::int, 0) > 0;

            IF jsonb_array_length(v_queue) = 0 THEN
                UPDATE drafts
                SET current_queue = '[]'::jsonb, pick_quotas = v_quotas,
                    status = 'finished', finished_at = NOW(), updated_at = NOW()
                WHERE id = p_draft_id;
                PERFORM _draft_finalize_midseason(p_draft_id);
                RETURN;
            END IF;
        END IF;

        UPDATE drafts
        SET current_queue = v_queue, pick_quotas = v_quotas, round = v_new_round, updated_at = NOW()
        WHERE id = p_draft_id;
        RETURN;
    END IF;

    -- ---- Pre-season: regular rounds, then catch-up rounds for owed picks ----
    v_debts := COALESCE(d.skip_debts, '{}'::jsonb);

    -- A pick taken in a catch-up round repays one owed pick.
    IF d.round > d.total_rounds THEN
        v_debts := jsonb_set(
            v_debts,
            ARRAY[p_squad_id::text],
            to_jsonb(GREATEST(COALESCE((v_debts->>p_squad_id::text)::int, 0) - 1, 0))
        );
    END IF;

    IF jsonb_array_length(v_queue) = 0 THEN
        v_new_round := d.round + 1;
        IF v_new_round > d.total_rounds THEN
            -- Catch-up round: original order, debtors only. When nobody owes
            -- anything the draft is genuinely complete.
            -- WITH ORDINALITY + explicit ORDER BY: the catch-up round must run
            -- in the original draft order, so that is stated rather than relied
            -- upon as an artefact of how the set-returning function is scanned.
            SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb) INTO v_queue
            FROM jsonb_array_elements_text(d.pick_order) WITH ORDINALITY AS t(elem, ord)
            WHERE COALESCE((v_debts->>elem)::int, 0) > 0;

            IF jsonb_array_length(v_queue) = 0 THEN
                UPDATE drafts
                SET current_queue = '[]'::jsonb, skip_debts = v_debts, round = d.round,
                    status = 'finished', finished_at = NOW(), updated_at = NOW()
                WHERE id = p_draft_id;
                PERFORM _draft_finalize(p_draft_id);
                RETURN;
            END IF;
        ELSE
            v_queue := d.pick_order;
        END IF;
    END IF;

    UPDATE drafts
    SET current_queue = v_queue, skip_debts = v_debts, round = v_new_round, updated_at = NOW()
    WHERE id = p_draft_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Undo — restore the debt map along with the queue
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION draft_undo(p_draft_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_pick draft_picks;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status = 'setup' OR d.status = 'drops' THEN RAISE EXCEPTION 'DRAFT_NOT_STARTED'; END IF;

    SELECT * INTO v_pick FROM draft_picks
    WHERE draft_id = p_draft_id
    ORDER BY pick_number DESC
    LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOTHING_TO_UNDO'; END IF;

    IF d.status = 'finished' THEN
        IF d.kind = 'midseason' THEN
            PERFORM _draft_unfinalize_midseason(p_draft_id);
        ELSE
            PERFORM _draft_unfinalize(p_draft_id);
        END IF;
    END IF;

    -- Restore the popped squad's quota when undoing a mid-season pick.
    IF d.kind = 'midseason' THEN
        UPDATE drafts
        SET pick_quotas = jsonb_set(
                pick_quotas,
                ARRAY[v_pick.squad_id::text],
                to_jsonb(COALESCE((pick_quotas->>v_pick.squad_id::text)::int, 0) + 1)
            )
        WHERE id = p_draft_id;
    END IF;

    DELETE FROM draft_picks WHERE id = v_pick.id;

    UPDATE drafts
    SET round = v_pick.round_before,
        current_queue = v_pick.queue_before,
        -- Picks written before this migration have no snapshot; keep what the
        -- draft already holds rather than wiping the debt map.
        skip_debts = COALESCE(v_pick.skip_debts_before, skip_debts),
        status = 'live',
        finished_at = NULL,
        updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;
