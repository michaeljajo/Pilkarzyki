-- =====================================================================
-- Migration 026: Mid-season draft
--
-- Extends the live-draft engine (migration 022) to support a mid-season draft
-- that runs ALONGSIDE the pre-season one, without disturbing it:
--
--   * drafts.kind  distinguishes 'preseason' (existing) from 'midseason'.
--   * A league may now hold multiple drafts over time (one pre-season + later
--     mid-season drafts), but never two UNFINISHED drafts at once.
--   * A 'drops' status + draft_drops staging table drive the manager-facing
--     drop window: each manager releases players; their pick quota = the number
--     they dropped (variable per manager).
--   * drafts.pick_quotas holds the remaining picks per squad; a squad leaves the
--     round rotation once its quota is exhausted (linear rounds, variable depth).
--   * Finalisation awards picks through player_transfers (type 'draft') instead
--     of overwriting players.manager_id directly, preserving goal history — and
--     also maintains the squad_players junction (which the transfer triggers do
--     not touch).
--
-- Idempotent where practical.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------

-- Pre-season vs mid-season.
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'preseason';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drafts_kind_check') THEN
        ALTER TABLE drafts ADD CONSTRAINT drafts_kind_check CHECK (kind IN ('preseason', 'midseason'));
    END IF;
END $$;

-- Remaining pick quota per squad: { "<squad_id>": <int>, ... }. Empty for
-- pre-season (which uses the uniform total_rounds model).
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS pick_quotas JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Allow the 'drops' status (drop window open) in addition to the existing set.
ALTER TABLE drafts DROP CONSTRAINT IF EXISTS drafts_status_check;
ALTER TABLE drafts ADD CONSTRAINT drafts_status_check
    CHECK (status IN ('drops', 'setup', 'live', 'finished'));

-- Drop the one-row-per-league UNIQUE so multiple drafts can coexist over time,
-- but keep at most ONE unfinished draft per league via a partial unique index.
ALTER TABLE drafts DROP CONSTRAINT IF EXISTS drafts_league_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_drafts_one_active_per_league
    ON drafts (league_id) WHERE status <> 'finished';

-- Staging table for the drop window: what each manager chose to release. Cleared
-- with the draft (ON DELETE CASCADE). One row per (draft, player).
CREATE TABLE IF NOT EXISTS draft_drops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (draft_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_draft_drops_draft ON draft_drops(draft_id);

ALTER TABLE draft_drops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read draft drops" ON draft_drops;
CREATE POLICY "Anyone can read draft drops" ON draft_drops FOR SELECT USING (true);
GRANT ALL ON draft_drops TO anon, authenticated;
ALTER TABLE draft_drops REPLICA IDENTITY FULL;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'draft_drops') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE draft_drops;
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- Helper: effective date for mid-season transfers (next unlocked gameweek,
-- falling back to now() for a season that has not started).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _midseason_effective_date(p_league_id uuid)
RETURNS timestamptz AS $$
DECLARE
    v_effective timestamptz;
BEGIN
    SELECT MIN(start_date) INTO v_effective
    FROM gameweeks
    WHERE league_id = p_league_id AND lock_date >= NOW();
    RETURN COALESCE(v_effective, NOW());
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Close the drop window: release dropped players to the pool, set each squad's
-- pick quota = number dropped, and move the draft to 'setup' for ordering.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION draft_close_drops(p_draft_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_effective timestamptz;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.kind <> 'midseason' THEN RAISE EXCEPTION 'NOT_MIDSEASON'; END IF;
    IF d.status <> 'drops' THEN RAISE EXCEPTION 'NOT_IN_DROPS'; END IF;
    IF NOT EXISTS (SELECT 1 FROM draft_drops WHERE draft_id = p_draft_id) THEN
        RAISE EXCEPTION 'NO_DROPS';
    END IF;

    v_effective := _midseason_effective_date(d.league_id);

    -- Release every dropped player to the pool (unassigned). The player_transfers
    -- triggers close the prior active row and null out players.manager_id.
    INSERT INTO player_transfers (player_id, manager_id, league_id, effective_from, effective_until, transfer_type)
    SELECT player_id, NULL, d.league_id, v_effective, NULL, 'draft'
    FROM draft_drops WHERE draft_id = p_draft_id;

    -- Remove released players from their old squad junction.
    DELETE FROM squad_players sp
    USING draft_drops dd
    WHERE dd.draft_id = p_draft_id AND sp.player_id = dd.player_id;

    -- Quota per squad = count of players it dropped.
    UPDATE drafts
    SET pick_quotas = (
        SELECT COALESCE(jsonb_object_agg(squad_id::text, cnt), '{}'::jsonb)
        FROM (
            SELECT squad_id, COUNT(*) AS cnt
            FROM draft_drops WHERE draft_id = p_draft_id
            GROUP BY squad_id
        ) q
    ),
        status = 'setup',
        updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Mid-season finalisation: award each pick to its manager via player_transfers
-- (preserving history) and maintain the squad_players junction.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _draft_finalize_midseason(p_draft_id uuid)
RETURNS void AS $$
DECLARE
    d drafts;
    v_effective timestamptz;
    r RECORD;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id;
    v_effective := _midseason_effective_date(d.league_id);

    FOR r IN SELECT squad_id, manager_id, player_id FROM draft_picks WHERE draft_id = p_draft_id LOOP
        INSERT INTO player_transfers (player_id, manager_id, league_id, effective_from, effective_until, transfer_type)
        VALUES (r.player_id, r.manager_id, d.league_id, v_effective, NULL, 'draft');

        DELETE FROM squad_players WHERE player_id = r.player_id;
        INSERT INTO squad_players (squad_id, player_id)
        VALUES (r.squad_id, r.player_id)
        ON CONFLICT (squad_id, player_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Quota-aware commit. Branches on draft kind so the pre-season engine behaviour
-- is unchanged; mid-season decrements the squad's quota, rebuilds each round's
-- queue from the surviving (quota > 0) squads, and finishes when all quotas hit
-- zero — finalising through player_transfers.
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
        draft_id, squad_id, manager_id, player_id, round, pick_number, round_before, queue_before
    ) VALUES (
        p_draft_id, p_squad_id, p_manager_id, p_player_id, d.round, v_next_pick_number, d.round, d.current_queue
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
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_queue
            FROM jsonb_array_elements_text(d.pick_order) elem
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

    -- ---- Pre-season (unchanged): uniform linear rounds up to total_rounds ----
    IF jsonb_array_length(v_queue) = 0 THEN
        v_new_round := d.round + 1;
        IF v_new_round > d.total_rounds THEN
            UPDATE drafts
            SET current_queue = '[]'::jsonb, round = d.total_rounds,
                status = 'finished', finished_at = NOW(), updated_at = NOW()
            WHERE id = p_draft_id;
            PERFORM _draft_finalize(p_draft_id);
            RETURN;
        ELSE
            v_queue := d.pick_order;
        END IF;
    END IF;

    UPDATE drafts
    SET current_queue = v_queue, round = v_new_round, updated_at = NOW()
    WHERE id = p_draft_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Undo for a finished draft must reverse the correct finalisation. Mid-season
-- finalisation is history-based, so undoing the pick that finished a mid-season
-- draft removes the awarding transfer row (and restores the squad junction).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _draft_unfinalize_midseason(p_draft_id uuid)
RETURNS void AS $$
DECLARE
    d drafts;
    r RECORD;
    v_prev_manager uuid;
    v_prev_squad uuid;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id;

    FOR r IN SELECT squad_id, player_id FROM draft_picks WHERE draft_id = p_draft_id LOOP
        -- Remove the awarding (active) draft transfer for this player.
        DELETE FROM player_transfers
        WHERE player_id = r.player_id
          AND league_id = d.league_id
          AND transfer_type = 'draft'
          AND effective_until IS NULL;

        -- Reopen the previous transfer (the release-to-pool row) as active.
        UPDATE player_transfers
        SET effective_until = NULL
        WHERE id = (
            SELECT id FROM player_transfers
            WHERE player_id = r.player_id AND league_id = d.league_id
            ORDER BY effective_from DESC, created_at DESC
            LIMIT 1
        );

        -- The player is back in the pool: drop the awarded squad junction row.
        DELETE FROM squad_players WHERE squad_id = r.squad_id AND player_id = r.player_id;

        -- Sync players.manager_id to the now-active transfer.
        SELECT manager_id INTO v_prev_manager FROM player_transfers
        WHERE player_id = r.player_id AND effective_until IS NULL
        ORDER BY effective_from DESC LIMIT 1;
        UPDATE players SET manager_id = v_prev_manager WHERE id = r.player_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Route undo's un-finalisation to the correct variant based on kind.
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
        status = 'live',
        finished_at = NULL,
        updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;
