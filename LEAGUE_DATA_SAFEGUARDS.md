# League Data Isolation Safeguards

This document outlines the safeguards in place to prevent cross-league data mixing.

## Problem Statement

In a multi-league fantasy football system, it's critical that data from different leagues remains completely isolated. Players, transfers, lineups, and results from one league should never affect or appear in another league.

## Safeguards Implemented

### 1. Database Schema Safeguards

#### A. Foreign Key Constraints
- **`player_transfers.league_id`**: References `leagues(id)` with CASCADE delete
- Ensures transfers are always tied to a valid league
- Located in: `supabase/migrations/015_add_league_to_transfers.sql`

#### B. Database Triggers (Migration 016)
Three triggers validate data consistency at the database level:

1. **`trigger_validate_transfer_league`** (on `player_transfers`)
   - Ensures transfer's `league_id` matches player's league
   - Prevents creating transfers for players in different leagues
   - Raises exception if mismatch detected

2. **`trigger_validate_squad_player_league`** (on `squad_players`)
   - Validates player belongs to same league as squad
   - Prevents adding players from other leagues to squads
   - Raises exception if mismatch detected

3. **`trigger_validate_lineup_player_league`** (on `lineups`)
   - Validates all players in lineup belong to gameweek's league
   - Checks each player_id in the player_ids array
   - Raises exception if any player is from wrong league

#### C. Composite Indexes
- `idx_player_transfers_player_league` on `(player_id, league_id)`
- `idx_player_transfers_league_dates` on `(league_id, effective_from, effective_until)`
- Ensures efficient league-filtered queries

#### D. Monitoring View
- **`cross_league_data_issues`**: View that identifies any cross-league inconsistencies
- Should always return 0 rows
- Run regularly to verify data integrity

### 2. Application Code Safeguards

#### A. Transfer Resolution (`src/utils/transfer-resolver.ts`)

**Function: `batchGetManagersAtGameweek(playerIds, gameweekId, leagueId)`**
- **Required parameter**: `leagueId` (added in fix)
- Filters transfers by `league_id` to prevent cross-league lookups
- Validates gameweek belongs to specified league
- Returns only managers from the correct league

**Function: `createPlayerTransfer(playerId, managerId, effectiveFrom, transferType, leagueId, ...)`**
- **Required parameter**: `leagueId` (added in fix)
- Validates player belongs to specified league before creating transfer
- Ensures league consistency at creation time

#### B. Import Endpoints

**`/api/admin/players/import`**
- Always uses `leagueName` from target league (line 239)
- Comment: "CRITICAL: Must match the target league"
- Never uses league name from uploaded file data

**`/api/admin/players/draft`**
- Passes `leagueId` to all `createPlayerTransfer()` calls
- League context maintained throughout draft process
- Validates all players belong to target league (line 176)

#### C. Top Scorers API (`/api/leagues/[id]/top-scorers`)
- Filters players by `league.name` (line 209)
- Filters gameweeks by `league_id` (line 74)
- Passes `leagueId` to `batchGetManagersAtGameweek()` (line 163)
- Triple-layer filtering ensures complete isolation

#### D. Results API (`/api/leagues/[id]/results`)
- Filters by `league_id` at multiple levels
- Passes `leagueId` to manager resolution (line 86)

### 3. Type System Safeguards

#### Updated Interfaces (`src/types/index.ts`)
```typescript
export interface PlayerTransferRow {
  league_id: string  // Required for data isolation (line 157)
  // ... other fields
}
```

## How to Verify Safeguards

### Run the Validation View
```sql
SELECT * FROM cross_league_data_issues;
```
Expected result: 0 rows

### Run the Diagnostic Script
```bash
npm exec -- tsx scripts/verify-league-isolation.ts
```

### Test Cross-League Scenarios
1. Try importing players with wrong league context → Should fail
2. Try creating transfer for player in different league → Should fail (trigger)
3. Try adding player to squad in different league → Should fail (trigger)
4. Try creating lineup with players from different league → Should fail (trigger)

## Migration History

- **Migration 014**: Added `player_transfers` table (initial implementation)
- **Migration 015**: Added `league_id` to transfers, updated functions, backfilled data
- **Migration 016**: Added validation triggers and monitoring view

## Lessons Learned

### Root Cause of Original Issue
1. `player_transfers` table initially had no `league_id` column
2. When Test league draft was uploaded, transfers were created without league context
3. Top scorers query pulled transfers from ANY league, causing data mixing

### Prevention Strategy
1. **Database-level validation**: Triggers catch issues at insertion time
2. **Application-level validation**: Functions validate before database calls
3. **Query-level filtering**: All queries filter by league_id
4. **Monitoring**: View helps identify issues quickly

## Maintenance

### When Adding New Features
- [ ] Always include `league_id` in new tables that reference players/gameweeks
- [ ] Add league filtering to all queries
- [ ] Validate league context in API endpoints
- [ ] Update `cross_league_data_issues` view if needed

### Regular Checks
- Run validation view weekly
- Review any player/transfer imports for correct league assignment
- Monitor logs for trigger exceptions

## Contact
If you encounter cross-league data issues:
1. Check the `cross_league_data_issues` view
2. Run diagnostic scripts
3. Review recent imports/drafts
4. Check trigger logs for exceptions
