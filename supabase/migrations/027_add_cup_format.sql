-- =====================================================================
-- Migration 027: Configurable cup format
--
-- Replaces the hardcoded cup shape (4/8/16/32 managers, groups of 4, double
-- round-robin, top 2 per group) with a saved per-cup configuration. The
-- generator, qualification and knockout logic all derive from this `format`
-- JSONB blob instead of branching on manager counts.
--
-- Every existing cup keeps working unchanged: the column defaults to the
-- `legacy_4x4` preset (4 groups, double round-robin, top 2 per group, QF/SF
-- two-legged + single-leg final), which is exactly how the pre-existing
-- 16-manager cups were generated. Existing schedules are never regenerated,
-- so the format only affects qualification (topPerGroup = 2) and the knockout
-- round list, both of which match the legacy behaviour.
--
-- Also widens the `stage` CHECK constraints to allow 'round_of_32' so larger
-- brackets are possible later. No existing value is removed.
--
-- Idempotent where practical.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. cups.format
-- ---------------------------------------------------------------------
-- Shape (validated in application code, see src/utils/cup-scheduling.ts):
--   {
--     "preset": "legacy_4x4" | "two_groups_of_nine" | "custom",
--     "participantIds": "all" | string[],
--     "groups": { "count": int>=1, "sizes"?: int[], "legs": 1|2,
--                 "assignment": "manual"|"random" },
--     "qualification": { "topPerGroup": int, "bestRemaining": int },
--     "knockout": [ { "stage": CupStage, "legs": 1|2 }, ... ],
--     "aggregateTieBreak": "et_penalties"
--   }
ALTER TABLE cups
    ADD COLUMN IF NOT EXISTS format JSONB NOT NULL DEFAULT '{
        "preset": "legacy_4x4",
        "participantIds": "all",
        "groups": { "count": 4, "legs": 2, "assignment": "manual" },
        "qualification": { "topPerGroup": 2, "bestRemaining": 0 },
        "knockout": [
            { "stage": "quarter_final", "legs": 2 },
            { "stage": "semi_final", "legs": 2 },
            { "stage": "final", "legs": 1 }
        ],
        "aggregateTieBreak": "et_penalties"
    }'::jsonb;

COMMENT ON COLUMN cups.format IS
    'Saved cup format configuration; the schedule generator, qualification and knockout logic derive everything from this. Defaults to the legacy_4x4 preset.';

-- ---------------------------------------------------------------------
-- 2. Widen stage CHECK constraints to include 'round_of_32'
-- ---------------------------------------------------------------------
-- The constraints are unnamed in migration 002, so their generated names are
-- <table>_stage_check. Drop-if-exists then re-add with the wider allow-list.

-- cups.stage
ALTER TABLE cups DROP CONSTRAINT IF EXISTS cups_stage_check;
ALTER TABLE cups ADD CONSTRAINT cups_stage_check
    CHECK (stage IN ('group_stage', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'));

-- cup_gameweeks.stage
ALTER TABLE cup_gameweeks DROP CONSTRAINT IF EXISTS cup_gameweeks_stage_check;
ALTER TABLE cup_gameweeks ADD CONSTRAINT cup_gameweeks_stage_check
    CHECK (stage IN ('group_stage', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'));

-- cup_matches.stage
ALTER TABLE cup_matches DROP CONSTRAINT IF EXISTS cup_matches_stage_check;
ALTER TABLE cup_matches ADD CONSTRAINT cup_matches_stage_check
    CHECK (stage IN ('group_stage', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'));
