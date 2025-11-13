-- Add Match Number Support for Knockout Stages
-- Allows referencing specific matches (e.g., QF1, QF2, SF1, SF2)

-- Add match_number column to cup_matches
ALTER TABLE cup_matches
  ADD COLUMN match_number INTEGER;

-- Add index for quick lookup by stage and match number
CREATE INDEX idx_cup_matches_stage_match_number ON cup_matches(cup_id, stage, match_number, leg)
  WHERE match_number IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN cup_matches.match_number IS 'Match number within a stage (e.g., 1 for QF1, 2 for QF2). Used to reference match winners in subsequent rounds.';
