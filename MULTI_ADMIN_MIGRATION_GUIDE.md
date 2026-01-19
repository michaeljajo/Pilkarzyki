# Multi-Admin Migration Guide

## Overview
This migration adds support for multiple admins per league, removing the concept of "global admins" for league management. Each user must be explicitly added as a league admin.

## Changes Made

### 1. Database Schema
- **New Table**: `league_admins` (junction table for many-to-many relationship)
  - `id`: UUID primary key
  - `league_id`: Reference to leagues table
  - `user_id`: Reference to users table
  - `created_at`: Timestamp
  - `created_by`: Optional reference to user who granted access
  - Unique constraint on (league_id, user_id)
  - Max 5 admins per league (enforced in application layer)

- **Existing Data**: Migration automatically copies existing `admin_id` values to the new table
- **Backward Compatibility**: `admin_id` column in `leagues` table is kept but deprecated

### 2. Code Updates

**TypeScript Types** (`src/types/index.ts`):
- Added `LeagueAdmin` and `LeagueAdminRow` interfaces
- Marked `League.adminId` as deprecated

**Auth Helpers** (`src/lib/auth-helpers.ts`):
- `verifyLeagueAdmin()` - Now checks `league_admins` table instead of `admin_id`
- `userAdminsAnyLeague()` - Uses `league_admins` table, no global admin bypass
- `getLeagueAdmins()` - New function to list all admins of a league
- `addLeagueAdmin()` - New function to add an admin (max 5 check)
- `removeLeagueAdmin()` - New function to remove an admin (prevents removing last admin)

**API Routes**: All routes using `verifyLeagueAdmin()` automatically work with new system (25+ routes)

## Migration Steps

### Step 1: Run Database Migration

**Option A: Supabase Dashboard**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `/supabase/migrations/017_add_league_admins.sql`
3. Paste and run

**Option B: Supabase CLI**
```bash
supabase db push
```

This will:
- Create the `league_admins` table
- Create indexes for performance
- Set up RLS policies
- Migrate existing `admin_id` data to the new table

### Step 2: Add WNC League Admins

After the migration runs successfully, add both users as WNC admins:

```bash
npm exec -- tsx scripts/add-wnc-admins.ts
```

This will:
- Find the WNC league
- Add technik87@tlen.pl as admin
- Add bartek.zoltowski88@gmail.com as admin
- Verify both users are now admins

### Step 3: Verify

Check that everything works:

1. **Database check**:
```sql
SELECT
  l.name as league,
  u.email as admin_email,
  u.first_name,
  u.last_name
FROM league_admins la
JOIN leagues l ON l.id = la.league_id
JOIN users u ON u.id = la.user_id
WHERE l.name ILIKE '%WNC%'
ORDER BY la.created_at;
```

2. **Application check**:
- Have technik87@tlen.pl log in and access WNC league admin pages
- Have bartek.zoltowski88@gmail.com log in and access WNC league admin pages
- Both should have full admin access

## Important Notes

### Admin Limits
- Maximum 5 admins per league (enforced in `addLeagueAdmin()`)
- Cannot remove the last admin from a league
- Duplicate admin assignments are prevented by database constraint

### No More Global Admins
- The `is_admin` field in the `users` table is no longer used for league access
- Users must be explicitly added to `league_admins` table
- This provides better security and clearer permissions

### Backward Compatibility
- The `admin_id` field is kept in the `leagues` table for now
- It can be safely removed in a future migration once fully tested
- All code now uses `league_admins` table

## Rollback (if needed)

If you need to rollback:

1. Drop the `league_admins` table:
```sql
DROP TABLE IF EXISTS league_admins CASCADE;
```

2. Revert code changes:
```bash
git restore src/lib/auth-helpers.ts src/types/index.ts
```

## Files Changed

**Migration Files**:
- `supabase/migrations/017_add_league_admins.sql`

**TypeScript Files**:
- `src/types/index.ts` - Added LeagueAdmin types
- `src/lib/auth-helpers.ts` - Updated all admin checking logic

**Scripts**:
- `scripts/add-wnc-admins.ts` - Add both users as WNC admins
- `scripts/create-league-admins-table.ts` - Alternative migration runner

**API Routes**: No changes needed (automatically work via `verifyLeagueAdmin()`)

## Future Enhancements

Consider adding:
1. Admin management UI in dashboard
2. Admin invitation system via email
3. Role-based permissions (owner vs co-admin)
4. Audit log for admin actions
5. Option to transfer primary ownership
