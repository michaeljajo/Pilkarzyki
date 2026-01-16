/**
 * Verify migration 015: Check that league_id is properly populated
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function verifyMigration() {
  console.log('🔍 Verifying transfer migration...\n')

  try {
    // 1. Check that all transfers have league_id
    console.log('1. Checking for NULL league_id values...')
    const { data: nullRecords, error: nullError } = await supabaseAdmin
      .from('player_transfers')
      .select('id, player_id, manager_id')
      .is('league_id', null)

    if (nullError) {
      console.error('❌ Error checking for NULL values:', nullError)
      return
    }

    if (nullRecords && nullRecords.length > 0) {
      console.error(`❌ Found ${nullRecords.length} transfers with NULL league_id!`)
      console.log('Sample records:')
      console.table(nullRecords.slice(0, 5))
    } else {
      console.log('✅ All transfers have league_id populated')
    }

    // 2. Check transfer count by league
    console.log('\n2. Transfer count by league...')
    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .order('name')

    if (leagues) {
      for (const league of leagues) {
        const { count } = await supabaseAdmin
          .from('player_transfers')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', league.id)

        console.log(`  ${league.name}: ${count} transfers`)
      }
    }

    // 3. Sample transfers with league info
    console.log('\n3. Sample transfers with league context...')
    const { data: sampleTransfers } = await supabaseAdmin
      .from('player_transfers')
      .select(`
        id,
        player_id,
        manager_id,
        league_id,
        effective_from,
        effective_until,
        transfer_type,
        players:player_id (
          name,
          surname,
          league
        ),
        leagues:league_id (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sampleTransfers) {
      console.log('\nRecent transfers:')
      sampleTransfers.forEach((t: any) => {
        const player = Array.isArray(t.players) ? t.players[0] : t.players
        const league = Array.isArray(t.leagues) ? t.leagues[0] : t.leagues
        console.log(`  - ${player?.name} ${player?.surname} (${player?.league}) → League: ${league?.name}`)
      })
    }

    // 4. Check for cross-league transfers (which shouldn't exist)
    console.log('\n4. Checking for cross-league issues...')
    const { data: allTransfers } = await supabaseAdmin
      .from('player_transfers')
      .select(`
        id,
        player_id,
        league_id,
        players:player_id (
          name,
          surname,
          league
        ),
        leagues:league_id (
          name
        )
      `)
      .limit(100)

    let inconsistencyCount = 0
    if (allTransfers) {
      for (const transfer of allTransfers) {
        const player = Array.isArray(transfer.players) ? transfer.players[0] : transfer.players
        const league = Array.isArray(transfer.leagues) ? transfer.leagues[0] : transfer.leagues

        if (player && league && player.league !== league.name) {
          inconsistencyCount++
          if (inconsistencyCount <= 5) {
            console.warn(`  ⚠️  Player ${player.name} ${player.surname} (${player.league}) has transfer in ${league.name}`)
          }
        }
      }
    }

    if (inconsistencyCount > 0) {
      console.error(`❌ Found ${inconsistencyCount} cross-league transfers!`)
    } else {
      console.log('✅ No cross-league transfers found')
    }

    console.log('\n✅ Migration verification complete!')

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message || error)
    process.exit(1)
  }
}

verifyMigration().then(() => {
  console.log('\nDone!')
  process.exit(0)
})
