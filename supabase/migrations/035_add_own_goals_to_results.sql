-- Record own goals separately from goals.
--
-- Until now an own goal was encoded as goals = -1 (007_update_goals_range.sql).
-- That made it impossible to record a player who scored AND put one into his
-- own net in the same match: the two cancelled out to 0, so neither team's
-- score (and so neither team's goals_for tiebreaker) received the goal.
--
-- After this migration:
--   results.goals      goals the player scored for his own team   (0-9)
--   results.own_goals  own goals, each credited to the opponent   (0-9)
--
-- Apply BEFORE deploying the code that reads own_goals: that code selects the
-- column, and the old code would be rejected by the tightened goals check.
-- Match scores and standings need no backfill — a -1 row already produced
-- exactly what goals = 0, own_goals = 1 produces.
--
-- Safe to re-run. The first attempt failed because production has no
-- constraint named goals_range_check (007 either never ran or its constraint
-- is named differently), so existing CHECK constraints on goals are found by
-- column rather than by name.

BEGIN;

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS own_goals INTEGER NOT NULL DEFAULT 0;

UPDATE results
SET goals = 0,
    own_goals = 1
WHERE goals = -1;

-- Drop every CHECK constraint that involves results.goals, whatever its name.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT DISTINCT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.results'::regclass
      AND con.contype = 'c'
      AND att.attname = 'goals'
  LOOP
    EXECUTE format('ALTER TABLE public.results DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE results DROP CONSTRAINT IF EXISTS own_goals_range_check;

ALTER TABLE results
  ADD CONSTRAINT goals_range_check CHECK (goals >= 0 AND goals <= 9),
  ADD CONSTRAINT own_goals_range_check CHECK (own_goals >= 0 AND own_goals <= 9);

COMMENT ON COLUMN results.goals IS 'Goals scored for the player''s own team (own goals excluded).';
COMMENT ON COLUMN results.own_goals IS 'Own goals; each adds 1 to the opponent''s match score.';

COMMIT;
