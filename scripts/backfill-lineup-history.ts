/**
 * Script to backfill existing lineups into the history tables
 * This creates a baseline snapshot of all current lineups
 * Run AFTER applying the migration: npx tsx scripts/backfill-lineup-history.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function backfillLineupHistory() {
  try {
    console.log('🔍 Fetching all existing league lineups...')

    // Get all league lineups
    const { data: lineups, error: lineupsError } = await supabaseAdmin
      .from('lineups')
      .select('*')
      .order('created_at', { ascending: true })

    if (lineupsError) {
      throw new Error(`Failed to fetch lineups: ${lineupsError.message}`)
    }

    console.log(`📊 Found ${lineups?.length || 0} league lineups`)

    if (lineups && lineups.length > 0) {
      console.log('📝 Inserting league lineups into history table...')

      // Insert all lineups into history
      const historyRecords = lineups.map(lineup => ({
        manager_id: lineup.manager_id,
        gameweek_id: lineup.gameweek_id,
        player_ids: lineup.player_ids,
        created_at: lineup.created_at || new Date().toISOString(),
        created_by_admin: lineup.created_by_admin || false,
        admin_creator_id: lineup.admin_creator_id || null
      }))

      const { error: insertError } = await supabaseAdmin
        .from('lineup_history')
        .insert(historyRecords)

      if (insertError) {
        throw new Error(`Failed to insert lineup history: ${insertError.message}`)
      }

      console.log(`✅ Inserted ${historyRecords.length} league lineup records into history`)
    }

    // Get all cup lineups
    console.log('\n🔍 Fetching all existing cup lineups...')

    const { data: cupLineups, error: cupLineupsError } = await supabaseAdmin
      .from('cup_lineups')
      .select('*')
      .order('created_at', { ascending: true })

    if (cupLineupsError) {
      throw new Error(`Failed to fetch cup lineups: ${cupLineupsError.message}`)
    }

    console.log(`📊 Found ${cupLineups?.length || 0} cup lineups`)

    if (cupLineups && cupLineups.length > 0) {
      console.log('📝 Inserting cup lineups into history table...')

      // Insert all cup lineups into history
      const cupHistoryRecords = cupLineups.map(lineup => ({
        manager_id: lineup.manager_id,
        cup_gameweek_id: lineup.cup_gameweek_id,
        player_ids: lineup.player_ids,
        created_at: lineup.created_at || new Date().toISOString()
      }))

      const { error: cupInsertError } = await supabaseAdmin
        .from('cup_lineup_history')
        .insert(cupHistoryRecords)

      if (cupInsertError) {
        throw new Error(`Failed to insert cup lineup history: ${cupInsertError.message}`)
      }

      console.log(`✅ Inserted ${cupHistoryRecords.length} cup lineup records into history`)
    }

    console.log('\n🎉 Backfill complete!')
    console.log('📋 Summary:')
    console.log(`   - League lineups backfilled: ${lineups?.length || 0}`)
    console.log(`   - Cup lineups backfilled: ${cupLineups?.length || 0}`)
    console.log('\n💡 From now on, all lineup changes will be automatically logged.')

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    console.error('\nPlease ensure:')
    console.error('1. The migration has been applied (lineup_history tables exist)')
    console.error('2. Your database connection is working')
    process.exit(1)
  }
}

backfillLineupHistory()
