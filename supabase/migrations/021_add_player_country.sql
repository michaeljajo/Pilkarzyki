-- Add country column to players table.
--
-- The 2026/27 player-import spreadsheet has six columns:
--   Imię (Name), Nazwisko (Surname), Kraj (Country), Liga (League),
--   Klub (Club), Pozycja (Position).
-- Country ("Kraj") is a new informational field (like club / football_league)
-- used only for display and filtering in the draft; it does not affect game
-- logic.
--
-- Idempotent.

ALTER TABLE players ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN players.country IS 'Player country of origin (Kraj) - informational only, used for display and draft filtering, not used in game logic';
