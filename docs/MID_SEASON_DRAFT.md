# Mid-Season Draft Feature

## Overview

The mid-season draft feature allows admins to process player reassignments during the season while preserving historical data integrity. This ensures that past results and goals remain attributed to the correct manager at the time they occurred.

## Key Features

✅ **Historical Data Preservation**: Past results and goals remain with the original manager
✅ **Transfer Tracking**: Complete audit trail of all player movements
✅ **Flexible Transfers**: Support for player swaps, new additions, and unassignments
✅ **Date Validation**: Prevents backdating transfers into locked gameweeks
✅ **Batch Processing**: Upload multiple transfers via Excel in one operation

## How It Works

### Database Architecture

The system uses a `player_transfers` table to track player-manager relationships over time:

```sql
player_transfers (
  player_id      - UUID reference to player
  manager_id     - UUID reference to manager (NULL for unassigned)
  effective_from - When this assignment starts
  effective_until - When this assignment ends (NULL for current)
  transfer_type  - 'initial' | 'draft' | 'swap'
)
```

### Data Flow

1. **Before Transfer**: Player owned by Manager A, scores 10 goals
2. **Draft Executed**: Player transferred to Manager B (effective from GW15)
3. **After Transfer**:
   - Historical results (GW1-14): Still show Manager A
   - Future results (GW15+): Show Manager B
   - Top scorers: Player appears twice (10 goals for A, future goals for B)

### Historical Query Resolution

When displaying historical data (e.g., GW10 results):

```
1. Find player's results for GW10
2. Look up player_transfers WHERE:
   - player_id = player.id
   - effective_from <= GW10.start_date
   - effective_until >= GW10.start_date OR effective_until IS NULL
3. Display manager from that transfer record
```

## Usage Guide

### For Admins: Processing a Draft

1. **Navigate to Draft Upload**
   - Go to: `/dashboard/admin/leagues/[league-id]/players/draft`

2. **Download Template**
   - Click "Download Template" to get the Excel file format
   - Template includes columns: Name, Position, Club, League (optional), Manager (optional), Team Name (optional)

3. **Prepare Draft Data**
   - Fill in the Excel file with updated player-manager assignments
   - For existing players: Change the Manager column to new manager
   - For new players: Add new rows
   - For unassignments: Leave Manager column empty

4. **Set Effective Date (Optional)**
   - Specify when transfers should take effect
   - Defaults to the start of the next unlocked gameweek
   - Cannot backdate into locked/completed gameweeks

5. **Upload and Review**
   - Upload the Excel file
   - Review the summary of transfers, new players, and any errors
   - System will display:
     - Number of transfers processed
     - Number of new players added
     - Number of unchanged players
     - Detailed list of all changes

### Example Draft Upload

**Scenario**: Mid-season draft after GW14, effective from GW15

Excel file content:
```
Name              | Position   | Club          | Manager
------------------|------------|---------------|------------------
Robert Lewandowski| Forward    | FC Barcelona  | john@example.com  (was: mike@example.com)
Kylian Mbappé     | Forward    | Real Madrid   | mike@example.com  (NEW PLAYER)
Lionel Messi      | Forward    | Inter Miami   |                   (UNASSIGNED)
```

**Result**:
- Lewandowski: Transferred from Mike to John (effective GW15)
  - Mike's team: Keeps all goals scored in GW1-14
  - John's team: Gets all goals from GW15 onwards
- Mbappé: New player assigned to Mike (from GW15)
- Messi: Transferred to unassigned (no manager from GW15)

## Technical Implementation

### Files Created/Modified

#### New Files
- `supabase/migrations/014_add_player_transfers.sql` - Database schema
- `src/utils/transfer-resolver.ts` - Transfer resolution utilities
- `src/app/api/admin/players/draft/route.ts` - Draft upload API
- `src/app/dashboard/admin/leagues/[id]/players/draft/page.tsx` - Draft upload UI

#### Modified Files
- `src/types/index.ts` - Added PlayerTransfer types
- `src/app/api/leagues/[id]/results/route.ts` - Uses transfer history
- `src/app/api/leagues/[id]/top-scorers/route.ts` - Uses transfer history

### Database Functions

#### `get_manager_at_gameweek(player_id, gameweek_id)`
Returns the manager who owned a player during a specific gameweek.

```sql
SELECT get_manager_at_gameweek(
  'player-uuid',
  'gameweek-uuid'
)
-- Returns: manager_id or NULL
```

#### `get_current_manager(player_id)`
Returns the currently active manager for a player.

```sql
SELECT get_current_manager('player-uuid')
-- Returns: manager_id or NULL
```

### Utility Functions

#### `batchGetManagersAtGameweek(playerIds, gameweekId)`
Efficiently resolves managers for multiple players at once.

```typescript
const managerMap = await batchGetManagersAtGameweek(
  ['player-1', 'player-2', 'player-3'],
  'gameweek-id'
)
// Returns: Map<playerId, managerId | null>
```

#### `validateTransferDate(leagueId, effectiveDate)`
Ensures transfer date doesn't conflict with locked gameweeks.

```typescript
const validation = await validateTransferDate(leagueId, new Date('2025-01-15'))
if (!validation.isValid) {
  console.error(validation.error)
}
```

## Migration Steps

### Initial Setup (First Time)

1. **Run Database Migration**
   ```bash
   # Connect to Supabase
   PGPASSWORD='your-password' psql "postgresql://..."

   # Run migration
   \i supabase/migrations/014_add_player_transfers.sql
   ```

2. **Verify Migration**
   ```sql
   -- Check table was created
   \d player_transfers

   -- Verify existing players were migrated
   SELECT COUNT(*) FROM player_transfers;
   ```

3. **Test Transfer Resolution**
   ```sql
   -- Test the helper function
   SELECT get_manager_at_gameweek(
     (SELECT id FROM players LIMIT 1),
     (SELECT id FROM gameweeks LIMIT 1)
   );
   ```

## Data Integrity Guarantees

### What's Preserved
✅ All historical results remain linked to original managers
✅ Past lineups show correct player-manager relationships
✅ Top scorers correctly split by historical ownership
✅ Match scores from past gameweeks unchanged
✅ Standings calculations remain accurate

### What Changes
🔄 Current squad rosters updated immediately
🔄 Future lineups use new manager assignments
🔄 Future results attribute to new managers

### Safeguards
🛡️ Cannot delete player_transfers (CASCADE protected)
🛡️ Cannot have overlapping transfer periods
🛡️ Cannot backdate into locked gameweeks
🛡️ Only one active transfer per player at a time
🛡️ Automatic triggers maintain data consistency

## Troubleshooting

### "Invalid transfer date" Error
**Cause**: Trying to set effective date before a locked gameweek
**Solution**: Choose a date that's at or after the next unlocked gameweek

### "Manager not found" Error
**Cause**: Manager email/name in Excel doesn't match any Clerk user
**Solution**: Ensure manager is registered in the system first, or use exact email address

### Historical Results Show Wrong Manager
**Cause**: Transfer history not being queried correctly
**Solution**: Check that the results/top-scorers APIs are using `batchGetManagersAtGameweek`

### Player Appears Multiple Times in Top Scorers
**Expected Behavior**: If a player transferred mid-season, they will appear once per manager with goals split accordingly

## Future Enhancements

Potential improvements for future iterations:

- [ ] Admin UI to view all transfers for a league
- [ ] Player profile showing transfer history
- [ ] Bulk transfer reversal/undo functionality
- [ ] Transfer notifications to affected managers
- [ ] Draft preview mode (dry run before committing)
- [ ] Support for transfer windows (date ranges)
- [ ] Trade validation (equal value swaps)

## Support

For issues or questions about the mid-season draft feature:
1. Check the error messages in the upload result
2. Verify the Excel file format matches the template
3. Ensure effective date is valid for the league
4. Review the transfer history in the database: `SELECT * FROM player_transfers WHERE player_id = 'xxx'`
