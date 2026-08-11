-- =====================================================================
-- Migration 028: Draft delegations (stand-ins)
--
-- Records who may pick on whose behalf during a draft, so a manager who is
-- away can nominate a stand-in rather than stalling the board.
--
-- ---------------------------------------------------------------------
-- ALREADY APPLIED IN PRODUCTION — 2026-07-31
--
-- This table was created by hand in the Supabase SQL editor and the SQL was
-- never committed, so the repo did not describe the live schema. This file
-- was reconstructed on 2026-08-02 from the live database (information_schema
-- columns, pg_constraint, pg_indexes, pg_policies) to close that gap.
--
-- Do NOT run it against production — it is already there. It exists so a
-- fresh environment rebuilt from migrations matches production, and so the
-- draft code on feat/draft-ux-overhaul has a schema to land against.
-- Every statement is guarded with IF NOT EXISTS so re-running is harmless.
-- ---------------------------------------------------------------------
--
-- The uuid-ossp extension this relies on is created in 022_add_draft.sql,
-- which also creates the `drafts` table referenced below.
-- =====================================================================

CREATE TABLE IF NOT EXISTS draft_delegations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  draft_id           UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,

  -- The squad handing over its picks. Squad rather than user, because a
  -- delegation belongs to a manager's slot in this specific draft.
  delegator_squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,

  -- The user allowed to pick on their behalf.
  delegate_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Admin who set it up. Nullable, and SET NULL rather than CASCADE: losing
  -- the audit of who arranged a stand-in must not delete the delegation and
  -- silently hand picks back mid-draft.
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One stand-in per squad per draft.
  UNIQUE (draft_id, delegator_squad_id)
);

-- Reproduced as it exists in production. Strictly speaking redundant — the
-- UNIQUE constraint above already indexes (draft_id, delegator_squad_id) and
-- btree can serve draft_id-only lookups from that leading column — but this
-- file's job is to match the live schema, not to improve on it.
CREATE INDEX IF NOT EXISTS idx_draft_delegations_draft
  ON draft_delegations (draft_id);

ALTER TABLE draft_delegations ENABLE ROW LEVEL SECURITY;

-- Read-only for clients, and deliberately unrestricted: the draft board shows
-- every participant who is currently standing in for someone, so the rows are
-- public within the app. They hold no data beyond three ids.
--
-- There is intentionally NO insert/update/delete policy. With RLS enabled that
-- blocks all writes from the anon and authenticated roles; delegations are
-- created only through API routes using the service-role client, which
-- bypasses RLS. Adding a write policy here would widen that surface.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'draft_delegations'
      AND policyname = 'Anyone can read draft delegations'
  ) THEN
    CREATE POLICY "Anyone can read draft delegations"
      ON draft_delegations FOR SELECT
      USING (true);
  END IF;
END $$;
