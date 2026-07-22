-- =====================================================================
-- Migration 022: Live in-app draft (Season 2026/27)
--
-- Adds the draft data model, atomic state-transition functions, RLS
-- policies and realtime publication membership.
--
-- 18 managers pick players one at a time from an imported pool, in an
-- admin-defined LINEAR order (same sequence every round, not snake), over
-- N rounds (default 8) -> each manager ends with squad_size unique players.
--
-- All state transitions are implemented as Postgres functions that lock the
-- drafts row FOR UPDATE, guaranteeing atomic pick/skip/undo even under
-- concurrent confirms. A UNIQUE(draft_id, player_id) constraint is the final
-- backstop against two near-simultaneous confirms of the same player.
--
-- Idempotent where practical (IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One draft per league.
CREATE TABLE IF NOT EXISTS drafts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'live', 'finished')),
    total_rounds INTEGER NOT NULL DEFAULT 8,
    squad_size INTEGER NOT NULL DEFAULT 8,
    round INTEGER NOT NULL DEFAULT 1,
    -- Immutable base order: JSON array of squad_id strings.
    pick_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Mutable ordered array of squad_ids remaining in the CURRENT round.
    -- current_queue[0] is the squad on the clock.
    current_queue JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only record of confirmed picks.
CREATE TABLE IF NOT EXISTS draft_picks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    -- Snapshot of draft state captured BEFORE this pick advanced the queue,
    -- so undo can restore the exact on-the-clock state.
    round_before INTEGER NOT NULL,
    queue_before JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (draft_id, player_id),
    UNIQUE (draft_id, pick_number)
);

-- Draft-night chat.
CREATE TABLE IF NOT EXISTS draft_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_picks_draft ON draft_picks(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_player ON draft_picks(player_id);
CREATE INDEX IF NOT EXISTS idx_draft_messages_draft ON draft_messages(draft_id, created_at);

-- updated_at trigger for drafts (reuses the shared function from schema.sql).
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------

-- Start the draft: fix the base order and go live.
CREATE OR REPLACE FUNCTION draft_start(p_draft_id uuid, p_pick_order jsonb)
RETURNS drafts AS $$
DECLARE
    d drafts;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'setup' THEN RAISE EXCEPTION 'DRAFT_ALREADY_STARTED'; END IF;
    IF p_pick_order IS NULL OR jsonb_typeof(p_pick_order) <> 'array' OR jsonb_array_length(p_pick_order) < 2 THEN
        RAISE EXCEPTION 'INVALID_ORDER';
    END IF;

    UPDATE drafts
    SET pick_order = p_pick_order,
        current_queue = p_pick_order,
        round = 1,
        status = 'live',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Materialise squad ownership from the picks (called when the draft finishes).
CREATE OR REPLACE FUNCTION _draft_finalize(p_draft_id uuid)
RETURNS void AS $$
BEGIN
    -- Assign each drafted player to its manager (mirrors the bulk-import
    -- assignment; no player_transfers rows for the initial season squad).
    UPDATE players p
    SET manager_id = dp.manager_id, updated_at = NOW()
    FROM draft_picks dp
    WHERE dp.draft_id = p_draft_id AND dp.player_id = p.id;

    -- Populate the squad_players junction.
    INSERT INTO squad_players (squad_id, player_id)
    SELECT dp.squad_id, dp.player_id
    FROM draft_picks dp
    WHERE dp.draft_id = p_draft_id
    ON CONFLICT (squad_id, player_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Reverse finalization (used when an undo re-opens a finished draft). During
-- the 'live' phase no ownership is materialised, so we clear it entirely.
CREATE OR REPLACE FUNCTION _draft_unfinalize(p_draft_id uuid)
RETURNS void AS $$
BEGIN
    DELETE FROM squad_players sp
    USING draft_picks dp
    WHERE dp.draft_id = p_draft_id
      AND sp.squad_id = dp.squad_id
      AND sp.player_id = dp.player_id;

    UPDATE players p
    SET manager_id = NULL, updated_at = NOW()
    FROM draft_picks dp
    WHERE dp.draft_id = p_draft_id AND dp.player_id = p.id;
END;
$$ LANGUAGE plpgsql;

-- Record a pick for the given squad and advance the queue. Assumes the caller
-- has already locked the drafts row and validated whose turn it is.
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
    v_next_pick_number INTEGER;
    v_queue JSONB;
    v_new_round INTEGER;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id;  -- already locked by caller

    -- Validate the player exists and belongs to this league's pool.
    SELECT l.name INTO v_league_name FROM leagues l WHERE l.id = d.league_id;
    SELECT p.league INTO v_player_league FROM players p WHERE p.id = p_player_id;
    IF v_player_league IS NULL THEN RAISE EXCEPTION 'PLAYER_NOT_FOUND'; END IF;
    IF v_player_league <> v_league_name THEN RAISE EXCEPTION 'PLAYER_WRONG_LEAGUE'; END IF;

    -- Already picked? (UNIQUE constraint is the hard backstop below.)
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

    -- Advance: pop the front of the queue.
    v_queue := d.current_queue - 0;
    v_new_round := d.round;

    IF jsonb_array_length(v_queue) = 0 THEN
        v_new_round := d.round + 1;
        IF v_new_round > d.total_rounds THEN
            UPDATE drafts
            SET current_queue = '[]'::jsonb,
                round = d.total_rounds,
                status = 'finished',
                finished_at = NOW(),
                updated_at = NOW()
            WHERE id = p_draft_id;
            PERFORM _draft_finalize(p_draft_id);
            RETURN;
        ELSE
            v_queue := d.pick_order;  -- reset for the next round (linear order)
        END IF;
    END IF;

    UPDATE drafts
    SET current_queue = v_queue, round = v_new_round, updated_at = NOW()
    WHERE id = p_draft_id;
END;
$$ LANGUAGE plpgsql;

-- Manager pick: enforces that the requesting user is on the clock.
CREATE OR REPLACE FUNCTION draft_make_pick(
    p_draft_id uuid,
    p_user_internal_id uuid,
    p_player_id uuid
) RETURNS drafts AS $$
DECLARE
    d drafts;
    v_squad_id uuid;
    v_manager_id uuid;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'live' THEN RAISE EXCEPTION 'DRAFT_NOT_LIVE'; END IF;

    v_squad_id := (d.current_queue->>0)::uuid;
    IF v_squad_id IS NULL THEN RAISE EXCEPTION 'NO_TURN'; END IF;

    SELECT manager_id INTO v_manager_id FROM squads WHERE id = v_squad_id;
    IF v_manager_id IS DISTINCT FROM p_user_internal_id THEN
        RAISE EXCEPTION 'NOT_YOUR_TURN';
    END IF;

    PERFORM _draft_commit_pick(p_draft_id, v_squad_id, v_manager_id, p_player_id);

    SELECT * INTO d FROM drafts WHERE id = p_draft_id;
    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Admin pick on behalf of whoever is on the clock (deferred/absent manager).
CREATE OR REPLACE FUNCTION draft_admin_pick(p_draft_id uuid, p_player_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_squad_id uuid;
    v_manager_id uuid;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'live' THEN RAISE EXCEPTION 'DRAFT_NOT_LIVE'; END IF;

    v_squad_id := (d.current_queue->>0)::uuid;
    IF v_squad_id IS NULL THEN RAISE EXCEPTION 'NO_TURN'; END IF;

    SELECT manager_id INTO v_manager_id FROM squads WHERE id = v_squad_id;
    PERFORM _draft_commit_pick(p_draft_id, v_squad_id, v_manager_id, p_player_id);

    SELECT * INTO d FROM drafts WHERE id = p_draft_id;
    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Skip: defer the on-the-clock manager to the END of the current round.
CREATE OR REPLACE FUNCTION draft_skip(p_draft_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_front jsonb;
    v_queue jsonb;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status <> 'live' THEN RAISE EXCEPTION 'DRAFT_NOT_LIVE'; END IF;
    -- If only one manager remains in the round there is no one to defer to;
    -- the admin must pick on their behalf instead.
    IF jsonb_array_length(d.current_queue) < 2 THEN RAISE EXCEPTION 'CANNOT_SKIP_LAST'; END IF;

    v_front := d.current_queue->0;
    v_queue := (d.current_queue - 0) || jsonb_build_array(v_front);

    UPDATE drafts SET current_queue = v_queue, updated_at = NOW()
    WHERE id = p_draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Undo the most recent pick; repeatable. Restores the exact pre-pick state
-- from the snapshot, returning the turn to the manager who made that pick.
CREATE OR REPLACE FUNCTION draft_undo(p_draft_id uuid)
RETURNS drafts AS $$
DECLARE
    d drafts;
    v_pick draft_picks;
BEGIN
    SELECT * INTO d FROM drafts WHERE id = p_draft_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'DRAFT_NOT_FOUND'; END IF;
    IF d.status = 'setup' THEN RAISE EXCEPTION 'DRAFT_NOT_STARTED'; END IF;

    SELECT * INTO v_pick FROM draft_picks
    WHERE draft_id = p_draft_id
    ORDER BY pick_number DESC
    LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOTHING_TO_UNDO'; END IF;

    -- If the draft had finished, roll back the materialised ownership first.
    IF d.status = 'finished' THEN
        PERFORM _draft_unfinalize(p_draft_id);
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

-- ---------------------------------------------------------------------
-- RLS + grants + realtime
-- ---------------------------------------------------------------------

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_messages ENABLE ROW LEVEL SECURITY;

-- Reads are public across the app, and realtime subscriptions enforce RLS,
-- so a permissive SELECT policy is required for the anon (Clerk-JWT) client.
DROP POLICY IF EXISTS "Anyone can read drafts" ON drafts;
CREATE POLICY "Anyone can read drafts" ON drafts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read draft picks" ON draft_picks;
CREATE POLICY "Anyone can read draft picks" ON draft_picks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read draft messages" ON draft_messages;
CREATE POLICY "Anyone can read draft messages" ON draft_messages FOR SELECT USING (true);

-- All writes go through the service-role client in API routes / RPCs (which
-- bypasses RLS). An admin FOR ALL policy is added for parity, using the
-- request.jwt.claims->>'sub' idiom (NOT auth.uid(), which does not match Clerk).
DROP POLICY IF EXISTS "Admins can manage drafts" ON drafts;
CREATE POLICY "Admins can manage drafts" ON drafts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
          AND is_admin = TRUE
    )
);

GRANT ALL ON drafts TO anon, authenticated;
GRANT ALL ON draft_picks TO anon, authenticated;
GRANT ALL ON draft_messages TO anon, authenticated;

-- Deliver full row images on UPDATE/DELETE so realtime filters and delete
-- events (e.g. undo removing a pick) carry the row data.
ALTER TABLE drafts REPLICA IDENTITY FULL;
ALTER TABLE draft_picks REPLICA IDENTITY FULL;
ALTER TABLE draft_messages REPLICA IDENTITY FULL;

-- Add the tables to the Supabase realtime publication (idempotent).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'drafts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE drafts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'draft_picks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE draft_picks;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'draft_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE draft_messages;
    END IF;
END $$;
