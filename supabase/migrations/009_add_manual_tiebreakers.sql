-- Migration: Add manual tiebreaker tables
-- This allows admins to manually decide table positions when teams are tied after all automatic criteria

-- Create manual_tiebreakers table for league standings
CREATE TABLE manual_tiebreakers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tiebreaker_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, manager_id)
);

-- Create cup_manual_tiebreakers table for cup group standings
CREATE TABLE cup_manual_tiebreakers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cup_id UUID REFERENCES cups(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tiebreaker_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cup_id, manager_id)
);

-- Add update triggers for updated_at columns
CREATE TRIGGER update_manual_tiebreakers_updated_at BEFORE UPDATE ON manual_tiebreakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cup_manual_tiebreakers_updated_at BEFORE UPDATE ON cup_manual_tiebreakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_manual_tiebreakers_league_id ON manual_tiebreakers(league_id);
CREATE INDEX idx_manual_tiebreakers_manager_id ON manual_tiebreakers(manager_id);
CREATE INDEX idx_cup_manual_tiebreakers_cup_id ON cup_manual_tiebreakers(cup_id);
CREATE INDEX idx_cup_manual_tiebreakers_manager_id ON cup_manual_tiebreakers(manager_id);

-- Add check constraint for tiebreaker value (must be positive)
ALTER TABLE manual_tiebreakers
ADD CONSTRAINT tiebreaker_value_positive CHECK (tiebreaker_value > 0);

ALTER TABLE cup_manual_tiebreakers
ADD CONSTRAINT cup_tiebreaker_value_positive CHECK (tiebreaker_value > 0);

-- Comments for documentation
COMMENT ON TABLE manual_tiebreakers IS 'Admin-set tiebreaker values for league standings when teams are tied on all automatic criteria';
COMMENT ON COLUMN manual_tiebreakers.tiebreaker_value IS 'Lower value = higher position in table. Only used when all automatic criteria are equal.';

COMMENT ON TABLE cup_manual_tiebreakers IS 'Admin-set tiebreaker values for cup group standings when teams are tied on all automatic criteria';
COMMENT ON COLUMN cup_manual_tiebreakers.tiebreaker_value IS 'Lower value = higher position in group. Only used when all automatic criteria are equal.';
