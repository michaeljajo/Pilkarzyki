-- Drop the players.country column.
--
-- Country ("Kraj") was added by migration 021 for the draft pool, but it is no
-- longer part of the data we import or work with. The import parser, draft UI
-- and add-player flow no longer reference it, so the column is safe to remove.
--
-- Idempotent.

ALTER TABLE players DROP COLUMN IF EXISTS country;
