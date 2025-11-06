# Team Names Feature - Implementation Guide

## Overview
This feature allows managers to set custom team names for each league they participate in. Team names are stored in the `squads` table and take priority over manager first_name/last_name in all displays.

## Completed Components

### 1. Database Migration
**File**: `supabase/migrations/005_add_team_names.sql`
- Added `team_name TEXT` column to `squads` table
- Added `UNIQUE(league_id, team_name)` constraint
- Added length validation: 3-30 characters
- Created index for performance

**To Apply**: Run this migration in Supabase dashboard or via CLI:
```bash
supabase db push
```

### 2. TypeScript Types
**File**: `src/types/index.ts`
- Added `teamName?: string` to `Squad` interface

### 3. Utility Functions
**File**: `src/utils/team-name-resolver.ts`

**Functions**:
- `getTeamOrManagerName(options)` - Returns display name with priority:
  1. squad.team_name
  2. manager.first_name + last_name
  3. manager.email

- `validateTeamName(teamName)` - Validates team name:
  - 3-30 characters
  - Alphanumeric + spaces + Polish characters
  - Returns `{ valid: boolean, error?: string }`

- `formatTeamName(teamName)` - Formats team name (capitalize each word)

### 4. API Endpoint
**File**: `src/app/api/squads/[id]/team-name/route.ts`

**Endpoint**: `PATCH /api/squads/[squadId]/team-name`

**Request Body**:
```json
{
  "teamName": "My Team Name"
}
```

**Response**:
```json
{
  "success": true,
  "teamName": "My Team Name"
}
```

**Features**:
- Validates team name format
- Checks uniqueness within league
- Verifies user owns squad (or is admin)
- Auto-formats team name

### 5. UI Component
**File**: `src/components/TeamNameModal.tsx`

**Props**:
```typescript
{
  squadId: string
  leagueName: string
  onSuccess: (teamName: string) => void
}
```

**Features**:
- Blocking modal UI
- Real-time validation
- Polish language
- Error handling

## Updated Display Files

### Pattern for Updating Files

**Before**:
```typescript
const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string }) => {
  if (manager?.first_name && manager?.last_name) {
    return `${manager.first_name} ${manager.last_name}`
  }
  if (manager?.first_name) {
    return manager.first_name
  }
  return manager?.email || 'Unknown Manager'
}
```

**After**:
```typescript
import { getTeamOrManagerName } from '@/utils/team-name-resolver'

const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string; squad?: { team_name?: string } }) => {
  return getTeamOrManagerName({
    manager: {
      first_name: manager.first_name,
      last_name: manager.last_name,
      email: manager.email
    },
    squad: manager.squad
  })
}
```

### Files Already Updated ✅
1. `src/components/CupMatchCard.tsx`
2. `src/app/dashboard/leagues/[id]/results/page.tsx`

### Files Requiring Update ⏳

**Components**:
- src/components/admin/MatchResultCard.tsx
- src/components/KnockoutBracket.tsx
- src/components/CupGroupTable.tsx
- src/components/admin/ScheduleGenerator.tsx

**Pages**:
- src/app/dashboard/admin/results/page.tsx
- src/app/dashboard/admin/leagues/[id]/results/page.tsx
- src/app/dashboard/admin/leagues/[id]/page.tsx
- src/app/dashboard/admin/leagues/[id]/cup/groups/page.tsx
- src/app/dashboard/admin/leagues/[id]/cup/schedule/page.tsx
- src/app/dashboard/admin/leagues/page.tsx
- src/app/dashboard/admin/players/page.tsx
- src/app/dashboard/leagues/[id]/cup/results/page.tsx

**API Routes** (These also need to SELECT team_name in queries):
- src/app/api/cups/[id]/results/route.ts
- src/app/api/cups/[id]/group-standings/route.ts
- src/app/api/cups/[id]/schedule/route.ts
- src/app/api/leagues/[id]/top-scorers/route.ts
- src/app/api/leagues/[id]/cup/top-scorers/route.ts
- src/app/api/leagues/[id]/standings/route.ts
- src/app/api/leagues/[id]/schedule/route.ts
- src/app/api/leagues/[id]/results/route.ts
- src/app/api/leagues/[id]/matches/route.ts
- src/app/api/manager/leagues/[id]/performance/route.ts
- src/app/api/admin/players/import/route.ts
- src/app/api/players/route.ts
- src/app/api/players/[id]/route.ts

## Critical: API Query Updates

All APIs that fetch manager data must include `team_name` in their SELECT queries.

**Example - Current**:
```typescript
const { data } = await supabaseAdmin
  .from('matches')
  .select(`
    *,
    home_manager:users!home_manager_id(
      id,
      first_name,
      last_name,
      email
    )
  `)
```

**Example - Updated**:
```typescript
const { data } = await supabaseAdmin
  .from('matches')
  .select(`
    *,
    home_manager:users!home_manager_id(
      id,
      first_name,
      last_name,
      email,
      squads!inner(team_name)
    )
  `)
```

**Note**: For squads join, you may need to filter by `league_id` to get the correct team name for the specific league.

## Integration Points

### 1. Team Name Modal Integration

Add to any league page that needs to block until team name is set:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { TeamNameModal } from '@/components/TeamNameModal'

export default function LeaguePage() {
  const [squadData, setSquadData] = useState<any>(null)
  const [showTeamNameModal, setShowTeamNameModal] = useState(false)

  useEffect(() => {
    // Fetch user's squad for this league
    fetchSquad()
  }, [])

  useEffect(() => {
    // Show modal if team_name is null
    if (squadData && !squadData.team_name) {
      setShowTeamNameModal(true)
    }
  }, [squadData])

  const handleTeamNameSet = (teamName: string) => {
    setSquadData({ ...squadData, team_name: teamName })
    setShowTeamNameModal(false)
  }

  return (
    <>
      {showTeamNameModal && (
        <TeamNameModal
          squadId={squadData.id}
          leagueName={leagueName}
          onSuccess={handleTeamNameSet}
        />
      )}
      {/* Rest of page content */}
    </>
  )
}
```

### 2. Settings/Profile Page

Add team name editing capability to league settings:

```typescript
<form onSubmit={handleUpdateTeamName}>
  <label>Nazwa drużyny</label>
  <input
    value={teamName}
    onChange={(e) => setTeamName(e.target.value)}
    maxLength={30}
  />
  <button type="submit">Zapisz</button>
</form>
```

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create new squad - verify team_name is NULL
- [ ] Set team name via API - verify it's saved
- [ ] Try duplicate team name in same league - verify error
- [ ] Try duplicate team name in different league - verify it works
- [ ] Verify team name displays in:
  - [ ] Match results
  - [ ] League standings
  - [ ] Cup standings
  - [ ] Schedule pages
  - [ ] Top scorers
  - [ ] Admin pages
- [ ] Verify fallback to first_name/last_name when team_name is NULL
- [ ] Verify modal blocks access until team name is set
- [ ] Test team name validation (too short, too long, invalid characters)
- [ ] Test team name formatting (capitalization)

## Migration Strategy for Existing Users

All existing squads will have `team_name = NULL` after migration. Options:

1. **Lazy Migration** (Recommended):
   - Show TeamNameModal on first league access
   - User sets team name before proceeding
   - No admin intervention needed

2. **Bulk Migration**:
   - Admin can bulk-assign default names (e.g., "Team [First Name]")
   - Users can change later in settings

3. **Optional**:
   - Allow team_name to remain NULL
   - System falls back to name/email
   - Encourage but don't require

## Next Steps

1. **Apply database migration**
2. **Update remaining display files** (use pattern above)
3. **Update API routes to SELECT team_name**
4. **Add TeamNameModal to key league entry points**
5. **Test thoroughly**
6. **Deploy**

## Rollback Plan

If issues arise:

```sql
-- Remove team name column
ALTER TABLE squads DROP COLUMN IF EXISTS team_name;

-- Remove indexes
DROP INDEX IF EXISTS idx_squads_team_name;

-- Remove constraints
ALTER TABLE squads DROP CONSTRAINT IF EXISTS squads_league_team_name_unique;
ALTER TABLE squads DROP CONSTRAINT IF EXISTS team_name_length;
```

Then revert code changes via git.
