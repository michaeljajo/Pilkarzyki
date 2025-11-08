# Default Lineup Auto-Application & Underline Feature

## Summary

This implementation adds **automatic default lineup application** when managers don't submit lineups before the gameweek lock_date, and **visually distinguishes** these lineups with underline styling.

## Investigation Results

After comprehensive investigation, **the default lineup auto-application feature did NOT exist** in the codebase. While default lineups were stored in the database, there was no automated mechanism to copy them to actual lineups when gameweeks locked.

## What Was Implemented

### 1. Database Migration (`supabase/migrations/008_add_is_from_default_to_lineups.sql`)

Added `is_from_default` boolean column to track when lineups were auto-created:
- `lineups.is_from_default` - for league lineups
- `cup_lineups.is_from_default` - for cup lineups
- Added indexes for performance
- Defaults to `false`

**Action Required**: Run this migration on your Supabase database via the SQL Editor or CLI.

### 2. Automated Default Lineup Application (`src/app/api/cron/apply-default-lineups/route.ts`)

New cron job endpoint that:
- Runs on a schedule (needs to be configured in Vercel)
- Finds all gameweeks that have passed their `lock_date` but aren't completed
- For each locked gameweek:
  - Identifies managers without lineups
  - Copies their default lineup to create an actual lineup
  - Sets `is_from_default = true`
  - Handles both league and cup lineups

**Action Required**: Configure this cron job in Vercel:
1. Go to your Vercel project settings
2. Navigate to Cron Jobs
3. Add: `/api/cron/apply-default-lineups`
4. Recommended schedule: Every 15 minutes or hourly
5. Add `CRON_SECRET` environment variable for security

### 3. API Updates

Updated these endpoints to include `is_from_default` in responses:
- `/api/gameweeks/[id]/matches-with-lineups` - league matches
- `/api/cups/[id]/results` - cup matches

### 4. TypeScript Type Updates (`src/types/index.ts`)

Added `is_from_default?: boolean` to:
- `Lineup` interface
- `ManagerLineup` interface
- `GameweekLineup` interface
- `CupLineup` interface

### 5. UI Components with Underline Styling

Updated components to show underlined player names when `is_from_default = true`:

**CupMatchCard** (`src/components/CupMatchCard.tsx`):
- Lines 140, 176: Added `isFromDefault` check
- Lines 147, 190: Applied `underline` class when true

**League Results Page** (`src/app/dashboard/leagues/[id]/results/page.tsx`):
- Lines 319, 355: Added `isFromDefault` check
- Lines 326, 369: Applied `underline` class when true

## How It Works

### Automatic Flow

1. **Gameweek Creation**: Admin creates gameweeks with `lock_date`
2. **Manager Setup**: Managers optionally set default lineups via the settings page
3. **Lock Time**: When `lock_date` passes, the cron job runs
4. **Auto-Application**: For managers without lineups:
   - Cron job copies `default_lineups.player_ids` → `lineups.player_ids`
   - Sets `is_from_default = true`
   - Sets `is_locked = true`
5. **Visual Indicator**: UI displays underlined player names for these auto-created lineups

### Visual Example

Normal lineup:
```
John Doe
Jane Smith
Mike Johnson
```

Lineup from default (underlined):
```
John Doe
Jane Smith
Mike Johnson
```

## Files Modified

### New Files
- `supabase/migrations/008_add_is_from_default_to_lineups.sql`
- `src/app/api/cron/apply-default-lineups/route.ts`
- `DEFAULT_LINEUP_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/app/api/gameweeks/[id]/matches-with-lineups/route.ts`
- `src/app/api/cups/[id]/results/route.ts`
- `src/types/index.ts`
- `src/components/CupMatchCard.tsx`
- `src/app/dashboard/leagues/[id]/results/page.tsx`

## Setup Instructions

### 1. Run Database Migration

Option A - Supabase Dashboard:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/008_add_is_from_default_to_lineups.sql`
3. Paste and run

Option B - Supabase CLI:
```bash
supabase db push
```

### 2. Configure Vercel Cron Job

1. Go to Vercel project → Settings → Cron Jobs
2. Click "Add Cron Job"
3. Path: `/api/cron/apply-default-lineups`
4. Schedule: `0 9,21 * * *` (twice daily at 9 AM and 9 PM) **RECOMMENDED**
   - Alternative: `0 * * * *` (hourly) if you need faster application
   - Alternative: `0 10 * * *` (daily at 10 AM) if all lock times are before 10 AM
5. Save

### 3. Add Environment Variable

Add to Vercel:
```
CRON_SECRET=<generate-a-secure-random-string>
```

Then add to `.env.local`:
```
CRON_SECRET=<same-secure-random-string>
```

### 4. Test the Feature

1. Create a default lineup for a manager (via Settings page)
2. Create a gameweek with a `lock_date` in the past
3. Don't create a regular lineup for that manager
4. Manually trigger cron: `curl -X GET https://your-app.vercel.app/api/cron/apply-default-lineups -H "Authorization: Bearer YOUR_CRON_SECRET"`
5. Check if lineup was created with `is_from_default = true`
6. View results page - player names should be underlined

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Cron job configured in Vercel
- [ ] `CRON_SECRET` environment variable set
- [ ] Default lineups can be set via Settings page
- [ ] Cron job runs and creates lineups from defaults
- [ ] `is_from_default` flag is set correctly
- [ ] Player names show underlined in league results
- [ ] Player names show underlined in cup results
- [ ] No TypeScript errors in build
- [ ] No runtime errors in console

## Future Enhancements

Possible improvements:
- Add a visual indicator (icon) next to underlined names
- Show tooltip explaining why players are underlined
- Add admin notification when default lineups are auto-applied
- Create admin dashboard to see which managers used defaults
- Allow managers to see history of when their defaults were used

## Notes

- All existing UI styling (colors, bold for goals, italic for not played) is preserved
- Underline is ONLY applied when `is_from_default = true`
- The feature works for both league and cup competitions
- Managers can still manually set lineups before lock_date to override their defaults

---

**Implementation Status**: ✅ Complete
**Testing Status**: ⚠️ Requires manual testing and Vercel setup
**Migration Status**: ⚠️ Requires database migration
