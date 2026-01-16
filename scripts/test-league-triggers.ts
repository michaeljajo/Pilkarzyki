/**
 * Test League Data Isolation Triggers
 * Attempts to create invalid cross-league data to verify triggers are working
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function testTriggers() {
  console.log('🧪 Testing League Data Isolation Triggers\n')

  try {
    // Get two different leagues
    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .limit(2)

    if (!leagues || leagues.length < 2) {
      console.log('❌ Need at least 2 leagues to test cross-league isolation')
      return
    }

    const league1 = leagues[0]
    const league2 = leagues[1]
    console.log(`Test leagues: ${league1.name} and ${league2.name}\n`)

    // Get a player from league 1
    const { data: player1 } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, league')
      .eq('league', league1.name)
      .limit(1)
      .single()

    if (!player1) {
      console.log(`❌ No players found in ${league1.name}`)
      return
    }

    console.log(`Test player: ${player1.name} ${player1.surname} (${player1.league})\n`)

    // Test 1: Try to create a transfer for league1 player in league2
    console.log('Test 1: Creating transfer for wrong league...')
    console.log(`  Attempting to create ${league2.name} transfer for ${league1.name} player`)

    const { error: transferError } = await supabaseAdmin
      .from('player_transfers')
      .insert({
        player_id: player1.id,
        league_id: league2.id, // WRONG LEAGUE
        manager_id: null,
        effective_from: new Date().toISOString(),
        transfer_type: 'trade'
      })

    if (transferError) {
      console.log(`  ✅ TRIGGER WORKING: ${transferError.message}`)
    } else {
      console.log(`  ❌ TRIGGER FAILED: Transfer was created (should have been blocked!)`)
    }

    // Test 2: Try to add a player from league1 to a squad in league2
    console.log('\nTest 2: Adding player to wrong league squad...')

    const { data: squad2 } = await supabaseAdmin
      .from('squads')
      .select('id, league_id, leagues:league_id(name)')
      .eq('league_id', league2.id)
      .limit(1)
      .single()

    if (squad2) {
      const squadLeague = Array.isArray(squad2.leagues) ? squad2.leagues[0] : squad2.leagues
      console.log(`  Attempting to add ${league1.name} player to ${squadLeague?.name} squad`)

      const { error: squadError } = await supabaseAdmin
        .from('squad_players')
        .insert({
          squad_id: squad2.id,
          player_id: player1.id // Player from different league
        })

      if (squadError) {
        console.log(`  ✅ TRIGGER WORKING: ${squadError.message}`)
      } else {
        console.log(`  ❌ TRIGGER FAILED: Squad player was created (should have been blocked!)`)

        // Clean up if trigger didn't work
        await supabaseAdmin
          .from('squad_players')
          .delete()
          .eq('squad_id', squad2.id)
          .eq('player_id', player1.id)
      }
    } else {
      console.log(`  ⚠️  No squad found in ${league2.name}, skipping test`)
    }

    // Test 3: Try to add a player from league1 to a lineup in league2
    console.log('\nTest 3: Adding player to wrong league lineup...')

    const { data: gameweek2 } = await supabaseAdmin
      .from('gameweeks')
      .select('id, week, league_id, leagues:league_id(name)')
      .eq('league_id', league2.id)
      .limit(1)
      .single()

    if (gameweek2) {
      const gwLeague = Array.isArray(gameweek2.leagues) ? gameweek2.leagues[0] : gameweek2.leagues
      console.log(`  Attempting to create ${gwLeague?.name} lineup with ${league1.name} player`)

      // Get any manager in league2
      const { data: squad } = await supabaseAdmin
        .from('squads')
        .select('manager_id')
        .eq('league_id', league2.id)
        .limit(1)
        .single()

      if (squad?.manager_id) {
        const { error: lineupError } = await supabaseAdmin
          .from('lineups')
          .insert({
            gameweek_id: gameweek2.id,
            manager_id: squad.manager_id,
            player_ids: [player1.id] // Player from different league
          })

        if (lineupError) {
          console.log(`  ✅ TRIGGER WORKING: ${lineupError.message}`)
        } else {
          console.log(`  ❌ TRIGGER FAILED: Lineup was created (should have been blocked!)`)

          // Clean up if trigger didn't work
          await supabaseAdmin
            .from('lineups')
            .delete()
            .eq('gameweek_id', gameweek2.id)
            .eq('manager_id', squad.manager_id)
        }
      } else {
        console.log(`  ⚠️  No manager found in ${league2.name}, skipping test`)
      }
    } else {
      console.log(`  ⚠️  No gameweek found in ${league2.name}, skipping test`)
    }

    // Test 4: Verify that valid same-league operations still work
    console.log('\nTest 4: Creating valid same-league transfer...')
    console.log(`  Attempting to create ${league1.name} transfer for ${league1.name} player`)

    const { error: validTransferError } = await supabaseAdmin
      .from('player_transfers')
      .insert({
        player_id: player1.id,
        league_id: league1.id, // CORRECT LEAGUE
        manager_id: null,
        effective_from: new Date().toISOString(),
        transfer_type: 'trade'
      })

    if (validTransferError) {
      console.log(`  ⚠️  Valid transfer failed: ${validTransferError.message}`)
    } else {
      console.log(`  ✅ Valid same-league transfer created successfully`)

      // Clean up
      await supabaseAdmin
        .from('player_transfers')
        .delete()
        .eq('player_id', player1.id)
        .eq('league_id', league1.id)
        .eq('transfer_type', 'trade')
        .is('manager_id', null)
    }

    // Check the monitoring view
    console.log('\n🔍 Checking cross_league_data_issues view...')

    const { data: issues, error: viewError } = await supabaseAdmin
      .from('cross_league_data_issues')
      .select('*')

    if (viewError) {
      console.log(`  ⚠️  View query failed: ${viewError.message}`)
      console.log('  This likely means migration 016 has not been run yet')
    } else if (issues && issues.length > 0) {
      console.log(`  ❌ Found ${issues.length} existing cross-league issues:`)
      issues.slice(0, 3).forEach(issue => {
        console.log(`    - ${issue.issue_type}: ${issue.player_name}`)
        console.log(`      ${issue.description}`)
      })
    } else {
      console.log('  ✅ No cross-league issues found!')
    }

    console.log('\n' + '='.repeat(60))
    console.log('Summary:')
    console.log('- If triggers are working, all cross-league attempts should fail')
    console.log('- If triggers are NOT installed, cross-league data will be created')
    console.log('- Run migration 016 in Supabase dashboard if triggers are missing')
    console.log('='.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

testTriggers().then(() => {
  console.log('\n✅ Testing complete!')
  process.exit(0)
})
