-- =====================================================================
-- Migration 028: Draft delegations (zastępstwa)
--
-- A manager who cannot attend the draft nominates another manager of the
-- same league to pick on his behalf. The delegate keeps picking for himself
-- in his own turn; when the delegator's squad reaches the front of the queue
-- the delegate may confirm a pick for it.
--
-- Applies to BOTH draft kinds — the table is keyed by draft_id, and the
-- authorisation lives in draft_make_pick, which the pre-season and mid-season
-- routes already share.
--
-- Idempotent (IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- At most one delegate per squad per draft. Cleared with the draft (CASCADE).
CREATE TABLE IF NOT EXISTS draft_delegations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    delegator_squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    delegate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Who created the delegation: the manager himself, or an admin acting for him.
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (draft_id, delegator_squad_id)
);

CREATE INDEX IF NOT EXISTS idx_draft_delegations_draft ON draft_delegations(draft_id);

-- Audit trail: who physically confirmed the pick, when it was not the owner.
-- NULL for ordinary self-picks and for admin picks.
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
-- RLS + grants + realtime
-- ---------------------------------------------------------------------

ALTER TABLE draft_delegations ENABLE ROW LEVEL SECURITY;

-- Reads are public across the app, and realtime subscriptions enforce RLS.
DROP POLICY IF EXISTS "Anyone can read draft delegations" ON draft_delegations;
CREATE POLICY "Anyone can read draft delegations" ON draft_delegations FOR SELECT USING (true);

GRANT ALL ON draft_delegations TO anon, authenticated;

ALTER TABLE draft_delegations REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'draft_delegations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE draft_delegations;
    END IF;
END $$;
