-- =====================================================================
-- Migration 030: Publicly visible leagues (showcase / onboarding)
--
-- A league flagged public is readable by ANY signed-in user, not just its
-- managers and admins. The intent is onboarding: point a new user at a
-- finished season so they can see a real table, real results and real squads
-- before they join anything of their own.
--
-- Read-only by design. This flag widens *visibility* only — every mutation
-- endpoint keeps checking league_admins / squad ownership, so a visitor can
-- look at a public league but never write to one. Pairing it with an archived
-- (is_active = false) season makes that doubly true, since archived leagues
-- reject writes outright.
--
-- Idempotent.
-- =====================================================================

ALTER TABLE leagues
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN leagues.is_public IS
  'When true, any signed-in user may VIEW this league (onboarding showcase). Never grants write access.';

-- Listing public leagues is a per-request lookup on the leagues landing page.
CREATE INDEX IF NOT EXISTS idx_leagues_is_public ON leagues(is_public) WHERE is_public;
