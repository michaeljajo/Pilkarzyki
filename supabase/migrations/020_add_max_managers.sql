-- Re-introduce a configurable per-league manager count.
--
-- The original max_managers column was dropped in 001_remove_max_managers.sql
-- because it was an unenforced UI display. For the 2026/27 season the league
-- size is admin-defined (default 18) and enforced when adding managers, so the
-- column returns as a real, NOT NULL setting.
--
-- Idempotent: the column may or may not exist depending on the environment.

ALTER TABLE leagues ADD COLUMN IF NOT EXISTS max_managers INTEGER NOT NULL DEFAULT 18;

COMMENT ON COLUMN leagues.max_managers IS 'Admin-defined maximum number of managers (squads) allowed in this league. Enforced when adding managers.';
