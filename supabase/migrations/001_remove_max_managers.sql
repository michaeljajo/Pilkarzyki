-- Remove max_managers column from leagues table
-- This column was not being enforced and only served as a UI display that was confusing to users

ALTER TABLE leagues DROP COLUMN IF EXISTS max_managers;