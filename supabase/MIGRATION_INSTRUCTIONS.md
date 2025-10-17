# Cup Tournament Database Migration Instructions

## Overview
This document provides instructions for applying the cup tournament database migrations.

## Migration Files
1. `002_add_cup_tournament.sql` - Creates cup tables and constraints
2. `003_cup_rls_policies.sql` - Sets up Row Level Security policies

## Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `002_add_cup_tournament.sql`
5. Click **Run**
6. Repeat for `003_cup_rls_policies.sql`

## Option 2: Supabase CLI
```bash
# If you have network access to your Supabase instance
supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres" --include-all
```

## Option 3: Direct psql
```bash
# Connect to your Supabase database
PGPASSWORD='YOUR_PASSWORD' psql "postgresql://postgres@YOUR_HOST:5432/postgres" -f supabase/migrations/002_add_cup_tournament.sql
PGPASSWORD='YOUR_PASSWORD' psql "postgresql://postgres@YOUR_HOST:5432/postgres" -f supabase/migrations/003_cup_rls_policies.sql
```

## Verification
After applying migrations, verify the tables exist:

```sql
-- Check that all cup tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'cup%';

-- Expected result:
-- cups
-- cup_groups
-- cup_gameweeks
-- cup_matches
-- cup_lineups
-- cup_group_standings
```

## Rollback (if needed)
```sql
-- Drop all cup tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS cup_group_standings CASCADE;
DROP TABLE IF EXISTS cup_lineups CASCADE;
DROP TABLE IF EXISTS cup_matches CASCADE;
DROP TABLE IF EXISTS cup_gameweeks CASCADE;
DROP TABLE IF EXISTS cup_groups CASCADE;
DROP TABLE IF EXISTS cups CASCADE;
```

## Next Steps
Once migrations are applied:
1. Verify table creation in Supabase dashboard
2. Test RLS policies with authenticated requests
3. Proceed with Phase 2: Backend API implementation
