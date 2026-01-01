-- Fix WNC league gameweek dates (2025 → 2026 for weeks 15-30)
-- League ID: 8b6d933e-e011-4fd5-8bc0-8344e2841192

-- Update gameweeks 15-30 to have 2026 dates instead of 2025
UPDATE gameweeks
SET
  start_date = start_date + INTERVAL '1 year',
  end_date = end_date + INTERVAL '1 year',
  lock_date = lock_date + INTERVAL '1 year'
WHERE
  league_id = '8b6d933e-e011-4fd5-8bc0-8344e2841192'
  AND week >= 15;

-- Reset is_completed for future gameweeks (those with end_date > now)
UPDATE gameweeks
SET is_completed = false
WHERE
  league_id = '8b6d933e-e011-4fd5-8bc0-8344e2841192'
  AND end_date > NOW()
  AND is_completed = true;

-- Find the first incomplete gameweek and set it as current
UPDATE leagues
SET current_gameweek = (
  SELECT week
  FROM gameweeks
  WHERE league_id = '8b6d933e-e011-4fd5-8bc0-8344e2841192'
    AND is_completed = false
  ORDER BY week ASC
  LIMIT 1
)
WHERE id = '8b6d933e-e011-4fd5-8bc0-8344e2841192';

-- Verify the changes
SELECT
  week,
  start_date::date,
  end_date::date,
  lock_date::date,
  is_completed,
  CASE
    WHEN end_date > NOW() THEN 'FUTURE'
    ELSE 'PAST'
  END as status
FROM gameweeks
WHERE league_id = '8b6d933e-e011-4fd5-8bc0-8344e2841192'
ORDER BY week;
