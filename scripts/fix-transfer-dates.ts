/**
 * Fix transfer effective_from dates
 * Set them to league start date so they apply to all gameweeks
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function fixTransferDates() {
  console.log('🔧 Fixing transfer effective dates...\n')

  try {
    // Get all leagues
    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name, start_date')

    for (const league of leagues || []) {
      console.log(`\nProcessing league: ${league.name}`)

      // Get earliest gameweek for this league
      const { data: earliestGW } = await supabaseAdmin
        .from('gameweeks')
        .select('start_date')
        .eq('league_id', league.id)
        .order('week', { ascending: true })
        .limit(1)
        .single()

      if (!earliestGW) {
        console.log('  No gameweeks found, skipping...')
        continue
      }

      const targetDate = league.start_date || earliestGW.start_date

      console.log(`  Earliest gameweek: ${earliestGW.start_date}`)
      console.log(`  Target effective_from: ${targetDate}`)

      // Find transfers with effective_from after the earliest gameweek
      const { data: problematicTransfers } = await supabaseAdmin
        .from('player_transfers')
        .select('id, player_id, effective_from')
        .eq('league_id', league.id)
        .gt('effective_from', earliestGW.start_date)

      if (!problematicTransfers || problematicTransfers.length === 0) {
        console.log('  ✅ No transfers need fixing')
        continue
      }

      console.log(`  Found ${problematicTransfers.length} transfers to fix`)

      // Update them to use the target date
      const { error: updateError } = await supabaseAdmin
        .from('player_transfers')
        .update({ effective_from: targetDate })
        .eq('league_id', league.id)
        .gt('effective_from', earliestGW.start_date)

      if (updateError) {
        console.error(`  ❌ Error updating transfers:`, updateError)
        continue
      }

      console.log(`  ✅ Fixed ${problematicTransfers.length} transfer records`)
    }

    console.log('\n✅ All transfer dates fixed!')

    // Verify the fix
    console.log('\n🔍 Verifying fix...\n')

    const unassignedPlayerNames = [
      { name: 'Vinicius', surname: 'Jr' },
      { name: 'Mohamed', surname: 'Salah' },
      { name: 'Serhou', surname: 'Guirassy' }
    ]

    const { data: wncLeague } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('name', 'WNC')
      .single()

    const { data: earliestGW } = await supabaseAdmin
      .from('gameweeks')
      .select('start_date')
      .eq('league_id', wncLeague!.id)
      .order('week', { ascending: true })
      .limit(1)
      .single()

    for (const { name, surname } of unassignedPlayerNames) {
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('id, name, surname')
        .eq('name', name)
        .eq('surname', surname)
        .eq('league', 'WNC')
        .single()

      if (!player) continue

      const { data: transfer } = await supabaseAdmin
        .from('player_transfers')
        .select('manager_id, effective_from')
        .eq('player_id', player.id)
        .eq('league_id', wncLeague!.id)
        .lte('effective_from', earliestGW!.start_date)
        .or(`effective_until.is.null,effective_until.gte.${earliestGW!.start_date}`)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()

      if (transfer) {
        console.log(`✅ ${player.name} ${player.surname}: Transfer found (manager: ${transfer.manager_id})`)
      } else {
        console.log(`❌ ${player.name} ${player.surname}: Still no transfer found!`)
      }
    }

  } catch (error: any) {
    console.error('\n❌ Fix failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

fixTransferDates().then(() => {
  console.log('\n✅ Done!')
  process.exit(0)
})
