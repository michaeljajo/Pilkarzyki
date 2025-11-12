# League Isolation Safeguards Implementation

## Problem Identified

Critical data integrity issue where cup gameweeks 2+ were pulling results from the wrong league:
- **Test league** (32 players) cup lineups referenced Test league players
- **WNC league** (128 players) had results created in the same gameweeks
- Due to duplicate player names across leagues, wrong player IDs were being used
- No validation existed to prevent cross-league data contamination

## Root Causes

1. **No Manager-League Validation**: Migration used ALL Clerk managers, not filtered by league squads
2. **No Player-Manager Validation**: No check that players belonged to the manager's squad
3. **No Player-League Validation**: Player lookup only matched by name, didn't validate league assignment
4. **Duplicate Name Vulnerability**: Same player names across different leagues caused ID confusion

## Safeguards Implemented

### Migration Import (src/app/api/admin/migration/import/route.ts)

#### 1. Manager Map Filtering (Lines 353-379)
```typescript
// CRITICAL SAFEGUARD: Create manager map ONLY with managers who have squads in THIS league
const { data: leagueSquads } = await supabaseAdmin
  .from('squads')
  .select('manager_id, team_name')
  .eq('league_id', leagueId)

const managerMap = new Map<string, string>() // email -> user_id (ONLY managers in this league)
```
**Protection**: Ensures only managers with squads in the target league can have lineups created

#### 2. Player Map Filtering (Lines 439-470)
```typescript
// CRITICAL SAFEGUARD: Only get players from THIS league AND assigned to managers in THIS league
const managerIds = Array.from(managerMap.values())

const { data: players } = await supabaseAdmin
  .from('players')
  .select('id, name, surname, manager_id, league')
  .eq('league', leagueName)
  .in('manager_id', managerIds)  // CRITICAL: Only players assigned to managers in this league
```
**Protection**: Double-filter ensures players belong to both the correct league AND correct managers

#### 3. Player Validation Maps (Lines 452-466)
```typescript
const playerMap = new Map<string, string>() // full_name -> player_id
const playerToManagerMap = new Map<string, string>() // player_id -> manager_id
const playerLeagueMap = new Map<string, string>() // player_id -> league_name
```
**Protection**: Maintains relationships for cross-validation during lineup creation

#### 4. Lineup Creation Validation (Lines 700-718)
```typescript
// CRITICAL SAFEGUARD: Validate player belongs to correct league
const playerLeague = playerLeagueMap.get(playerId)
if (playerLeague !== expectedLeague) {
  errors.push(
    `CRITICAL LEAGUE MISMATCH: Player "${player.name}" (ID: ${playerId}) belongs to league "${playerLeague}" but expected "${expectedLeague}". ` +
    `This would cause cross-league data contamination!`
  )
  continue
}

// CRITICAL SAFEGUARD: Validate player belongs to the manager
const playerManagerId = playerToManagerMap.get(playerId)
if (playerManagerId !== managerId) {
  errors.push(
    `CRITICAL MANAGER MISMATCH: Player "${player.name}" (ID: ${playerId}) belongs to manager "${playerManagerId}" but trying to assign to "${managerId}". ` +
    `This would cause incorrect lineup assignment!`
  )
  continue
}
```
**Protection**: Every player added to a lineup is validated against both league and manager

#### 5. Logging and Diagnostics (Lines 354-379, 449-470)
```typescript
console.log(`\n=== LEAGUE ISOLATION CHECK ===`)
console.log(`Target League: ${leagueName} (ID: ${leagueId})`)
console.log(`Total managers in league: ${managerMap.size}`)

console.log(`\n=== PLAYER VALIDATION ===`)
console.log(`Found ${players?.length || 0} players for league "${leagueName}"`)
```
**Protection**: Provides visibility into the isolation checks during import

### Existing API Safeguards (Already Present)

#### Cup Results API (src/app/api/cups/[id]/results/route.ts:166)
```typescript
const { data: players } = await supabaseAdmin
  .from('players')
  .select('id, name, surname, position, manager_id')
  .in('id', allPlayerIds)
  .eq('league', leagueName)  // CRITICAL: Filter by league to prevent cross-league player confusion
```
**Protection**: Results API already filters players by league when fetching data

## Cleanup Script

Created `scripts/delete-all-cup-data.ts` to safely remove all cup-related data:
- Deletes in correct order (foreign key constraints)
- Requires "DELETE" confirmation
- Preserves league matches, lineups, results, players, and squads
- Only deletes cup-specific data

## Next Steps to Fix WNC Cup Issue

### Step 1: Delete All Cup Data
```bash
cd "/Users/michael/Desktop/VS Code/Pilkarzyki"
npx tsx scripts/delete-all-cup-data.ts
```
Type "DELETE" when prompted to confirm.

### Step 2: Verify Cleanup
Check that all cup data is removed:
```bash
npx tsx scripts/check-cup-results-data.ts
```

### Step 3: Re-import Migration File
1. Go to http://localhost:3000/dashboard/admin/migration
2. Enter League ID: `791f04ae-290b-4aed-8cc7-6070beaefa3a`
3. Upload your migration Excel file
4. Click "Start Import"

### Step 4: Monitor Import Logs
The console will show:
```
=== LEAGUE ISOLATION CHECK ===
Target League: Test (ID: 791f04ae-290b-4aed-8cc7-6070beaefa3a)
  ✓ Manager in league: email@example.com (team: Team Name)
Total managers in league: X
===========================

=== PLAYER VALIDATION ===
Found X players for league "Test"
Player map size: X
========================
```

### Step 5: Verify Results
Check that Cup Weeks 2+ now show correct goals:
```bash
npx tsx scripts/check-cup-results-data.ts
```

## What These Safeguards Prevent

1. **Cross-League Data Contamination**: Players from one league can never appear in another league's lineups
2. **Manager Misassignment**: Managers without squads in a league cannot have data imported
3. **Player Theft**: Players cannot be assigned to managers who don't own them
4. **Duplicate Name Confusion**: Even if player names match, IDs are validated against league and manager
5. **Silent Failures**: All violations are logged with clear "CRITICAL" error messages

## Impact on Existing Code

- ✅ **No breaking changes** to existing API routes
- ✅ **No database schema changes** required
- ✅ **Migration import enhanced** with validation
- ✅ **Backwards compatible** with existing data
- ✅ **Cup results API already had safeguards** (line 166)

## Testing Recommendations

After re-import, verify:
1. Cup Week 1-2 still show correct results ✓
2. Cup Week 3+ now show correct results (not 0-0)
3. All goals displayed belong to Test league players
4. No WNC league data appears in Test league cup

## Future Recommendations

Consider adding database-level constraints:
```sql
-- Example: Ensure players in lineups belong to correct league
-- This would require schema changes and is beyond the scope of this fix
```
