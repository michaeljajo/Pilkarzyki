/**
 * Run migration 015: Add league context to player transfers
 * This script applies the migration step by step using Supabase RPC
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function runMigration() {
  try {
    console.log('🚀 Starting migration 015: Add league context to player transfers')
    console.log('')

    // Step 1: Add league_id column
    console.log('Step 1: Adding league_id column to player_transfers...')
    await supabaseAdmin.rpc('exec', {
      sql: 'ALTER TABLE player_transfers ADD COLUMN IF NOT EXISTS league_id UUID'
    }).then(() => console.log('  ✓ Column added'))

    // Step 2: Backfill league_id
    console.log('\nStep 2: Backfilling league_id from players table...')
    const { data: updateResult } = await supabaseAdmin.rpc('exec', {
      sql: `
        UPDATE player_transfers pt
        SET league_id = (
          SELECT l.id
          FROM players p
          JOIN leagues l ON p.league = l.name
          WHERE p.id = pt.player_id
          LIMIT 1
        )
        WHERE league_id IS NULL
      `
    })
    console.log('  ✓ Backfill complete')

    // Verify backfill
    const { data: nullCheck } = await supabaseAdmin
      .from('player_transfers')
      .select('id')
      .is('league_id', null)
      .limit(1)

    if (nullCheck && nullCheck.length > 0) {
      console.warn('  ⚠️  Warning: Some transfers still have NULL league_id')
      console.warn('  This might indicate orphaned transfers or players without leagues')
    } else {
      console.log('  ✓ All transfers have league_id set')
    }

    // Step 3: Make league_id NOT NULL
    console.log('\nStep 3: Making league_id required...')
    await supabaseAdmin.rpc('exec', {
      sql: 'ALTER TABLE player_transfers ALTER COLUMN league_id SET NOT NULL'
    }).then(() => console.log('  ✓ Column is now NOT NULL'))

    // Step 4: Add foreign key
    console.log('\nStep 4: Adding foreign key constraint...')
    await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE player_transfers
        ADD CONSTRAINT IF NOT EXISTS fk_player_transfers_league
        FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
      `
    }).then(() => console.log('  ✓ Foreign key added'))

    // Step 5: Update indexes
    console.log('\nStep 5: Updating indexes...')

    // Drop old indexes
    await supabaseAdmin.rpc('exec', {
      sql: 'DROP INDEX IF EXISTS idx_player_transfers_player_id'
    })
    await supabaseAdmin.rpc('exec', {
      sql: 'DROP INDEX IF EXISTS idx_player_transfers_effective_dates'
    })
    await supabaseAdmin.rpc('exec', {
      sql: 'DROP INDEX IF EXISTS idx_player_transfers_active'
    })
    console.log('  ✓ Old indexes dropped')

    // Create new indexes
    await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_player_transfers_player_league
        ON player_transfers(player_id, league_id)
      `
    })
    await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_player_transfers_league_dates
        ON player_transfers(league_id, effective_from, effective_until)
      `
    })
    await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_player_transfers_active_by_league
        ON player_transfers(player_id, league_id, effective_until)
        WHERE effective_until IS NULL
      `
    })
    console.log('  ✓ New indexes created')

    // Step 6: Update functions
    console.log('\nStep 6: Updating database functions...')

    // Update get_manager_at_gameweek
    await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_manager_at_gameweek(
          p_player_id UUID,
          p_gameweek_id UUID
        )
        RETURNS UUID AS $$
        DECLARE
          v_manager_id UUID;
          v_gameweek_start TIMESTAMPTZ;
          v_league_id UUID;
        BEGIN
          SELECT start_date, league_id INTO v_gameweek_start, v_league_id
          FROM gameweeks
          WHERE id = p_gameweek_id;

          IF v_gameweek_start IS NULL OR v_league_id IS NULL THEN
            RETURN NULL;
          END IF;

          SELECT manager_id INTO v_manager_id
          FROM player_transfers
          WHERE player_id = p_player_id
            AND league_id = v_league_id
            AND effective_from <= v_gameweek_start
            AND (effective_until IS NULL OR effective_until >= v_gameweek_start)
          ORDER BY effective_from DESC
          LIMIT 1;

          RETURN v_manager_id;
        END;
        $$ LANGUAGE plpgsql STABLE
      `
    })
    console.log('  ✓ get_manager_at_gameweek updated')

    // Update get_current_manager
    await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_current_manager(
          p_player_id UUID,
          p_league_id UUID
        )
        RETURNS UUID AS $$
        DECLARE
          v_manager_id UUID;
        BEGIN
          SELECT manager_id INTO v_manager_id
          FROM player_transfers
          WHERE player_id = p_player_id
            AND league_id = p_league_id
            AND effective_until IS NULL
          LIMIT 1;

          RETURN v_manager_id;
        END;
        $$ LANGUAGE plpgsql STABLE
      `
    })
    console.log('  ✓ get_current_manager updated')

    console.log('\n✅ Migration completed successfully!')
    console.log('\nVerifying migration...')

    // Verify
    const { data: transfers, error } = await supabaseAdmin
      .from('player_transfers')
      .select('id, player_id, league_id, manager_id')
      .limit(5)

    if (error) {
      console.error('❌ Verification failed:', error)
      return
    }

    console.log('\nSample transfers with league_id:')
    console.table(transfers)

    console.log('\n✅ Migration verification passed!')

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message || error)
    if (error.details) console.error('Details:', error.details)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  }
}

runMigration().then(() => {
  console.log('\nDone!')
  process.exit(0)
})
