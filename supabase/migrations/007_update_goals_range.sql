-- Update goals column to support own goals (-1) and regular goals (0-9)
-- Add check constraint to ensure goals are between -1 and 9

ALTER TABLE results
ADD CONSTRAINT goals_range_check CHECK (goals >= -1 AND goals <= 9);
