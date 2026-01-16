/**
 * 1. Delete all Test league data
 * 2. Fix initial transfer dates in WNC to be retroactive
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function cleanupAndFix() {
  console.log('🧹 Cleanup and Fix Script\n')

  try {
    // ========== STEP 1: Delete Test league data ==========
    console.log('Step 1: Deleting Test league data...')

    const { data: testLeague } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('name', 'Test')
      .single()

    if (testLeague) {
      console.log(`  Found Test league: ${testLeague.id}`)

      // Delete transfers for Test league players
      const { data: testPlayers } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('league', 'Test')

      const testPlayerIds = testPlayers?.map(p => p.id) || []

      if (testPlayerIds.length > 0) {
        const { error: transfersError, count: transfersCount } = await supabaseAdmin
          .from('player_transfers')
          .delete({ count: 'exact' })
          .in('player_id', testPlayerIds)

        console.log(`  ✓ Deleted ${transfersCount} transfer records`)
      }

      // Delete players
      const { error: playersError, count: playersCount } = await supabaseAdmin
        .from('players')
        .delete({ count: 'exact' })
        .eq('league', 'Test')

      console.log(`  ✓ Deleted ${playersCount} players`)

      // Delete gameweeks (this will cascade to lineups, matches, results)
      const { error: gwError, count: gwCount } = await supabaseAdmin
        .from('gameweeks')
        .delete({ count: 'exact' })
        .eq('league_id', testLeague.id)

      console.log(`  ✓ Deleted ${gwCount} gameweeks (cascade to lineups, matches, results)`)

      // Delete squads
      const { error: squadsError, count: squadsCount } = await supabaseAdmin
        .from('squads')
        .delete({ count: 'exact' })
        .eq('league_id', testLeague.id)

      console.log(`  ✓ Deleted ${squadsCount} squads`)

      // Delete the league itself
      const { error: leagueError } = await supabaseAdmin
        .from('leagues')
        .delete()
        .eq('id', testLeague.id)

      console.log(`  ✓ Deleted Test league`)
      console.log('  ✅ Test league completely removed!\n')
    } else {
      console.log('  No Test league found\n')
    }

    // ========== STEP 2: Fix WNC initial transfer dates ==========
    console.log('Step 2: Fixing WNC initial transfer dates...')

    const { data: wncLeague } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('name', 'WNC')
      .single()

    if (!wncLeague) {
      console.log('  WNC league not found')
      return
    }

    // Get earliest gameweek
    const { data: earliestGW } = await supabaseAdmin
      .from('gameweeks')
      .select('start_date, week')
      .eq('league_id', wncLeague.id)
      .order('week', { ascending: true })
      .limit(1)
      .single()

    if (!earliestGW) {
      console.log('  No gameweeks found')
      return
    }

    console.log(`  Earliest gameweek: Week ${earliestGW.week} (${earliestGW.start_date})`)

    // Find initial transfers that are dated after the earliest gameweek
    const { data: lateTransfers, count: lateCount } = await supabaseAdmin
      .from('player_transfers')
      .select('id, effective_from', { count: 'exact' })
      .eq('league_id', wncLeague.id)
      .eq('transfer_type', 'initial')
      .gt('effective_from', earliestGW.start_date)

    if (!lateTransfers || lateTransfers.length === 0) {
      console.log('  ✅ All initial transfers already have correct dates')
      return
    }

    console.log(`  Found ${lateCount} initial transfers with late effective_from dates`)

    // Set a backdated date (one day before earliest gameweek)
    const backdateTarget = new Date(earliestGW.start_date)
    backdateTarget.setDate(backdateTarget.getDate() - 1)

    console.log(`  Backdating to: ${backdateTarget.toISOString()}`)

    // Update the transfers
    const { error: updateError, count: updatedCount } = await supabaseAdmin
      .from('player_transfers')
      .update({
        effective_from: backdateTarget.toISOString()
      }, { count: 'exact' })
      .eq('league_id', wncLeague.id)
      .eq('transfer_type', 'initial')
      .gt('effective_from', earliestGW.start_date)

    if (updateError) {
      console.error('  ❌ Error updating transfers:', updateError)
      return
    }

    console.log(`  ✅ Fixed ${updatedCount} initial transfer dates\n`)

    // ========== STEP 3: Verify the fix ==========
    console.log('Step 3: Verifying fix...\n')

    const testPlayers = [
      { name: 'Vinicius', surname: 'Jr' },
      { name: 'Mohamed', surname: 'Salah' },
      { name: 'Serhou', surname: 'Guirassy' }
    ]

    for (const { name, surname } of testPlayers) {
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, manager_id')
        .eq('name', name)
        .eq('surname', surname)
        .eq('league', 'WNC')
        .single()

      if (!player) continue

      // Check if transfer now works for earliest gameweek
      const { data: transfer } = await supabaseAdmin
        .from('player_transfers')
        .select('manager_id, effective_from, transfer_type')
        .eq('player_id', player.id)
        .eq('league_id', wncLeague.id)
        .lte('effective_from', earliestGW.start_date)
        .or(`effective_until.is.null,effective_until.gte.${earliestGW.start_date}`)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()

      if (transfer && transfer.manager_id === player.manager_id) {
        console.log(`  ✅ ${player.name} ${player.surname}: Transfer found (${transfer.transfer_type})`)
      } else if (transfer) {
        console.log(`  ⚠️ ${player.name} ${player.surname}: Transfer found but manager mismatch`)
      } else {
        console.log(`  ❌ ${player.name} ${player.surname}: No transfer found`)
      }
    }

    console.log('\n✅ All done!')

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

cleanupAndFix().then(() => {
  console.log('\nComplete!')
  process.exit(0)
})
