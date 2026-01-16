/**
 * Test if database triggers are enforcing league isolation
 * Creates test data and attempts cross-league violations
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function testTriggerEnforcement() {
  console.log('🧪 Testing Database Trigger Enforcement\n')

  let testPlayerId: string | null = null
  let wncLeagueId: string | null = null
  let testLeagueId: string | null = null

  try {
    // Get WNC and test leagues
    const { data: wncLeague } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('name', 'WNC')
      .single()

    const { data: testLeague } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('name', 'test 2')
      .single()

    if (!wncLeague || !testLeague) {
      console.log('❌ Required leagues not found')
      return
    }

    wncLeagueId = wncLeague.id
    testLeagueId = testLeague.id

    console.log(`League 1: ${wncLeague.name} (${wncLeagueId})`)
    console.log(`League 2: ${testLeague.name} (${testLeagueId})\n`)

    // Create a test player in "test 2" league
    console.log('Creating test player in test 2 league...')
    const { data: testPlayer, error: createError } = await supabaseAdmin
      .from('players')
      .insert({
        name: 'Test',
        surname: 'Player',
        league: testLeague.name,
        position: 'Forward',
        club: 'Test FC',
        total_goals: 0
      })
      .select()
      .single()

    if (createError || !testPlayer) {
      console.log('❌ Failed to create test player:', createError?.message)
      return
    }

    testPlayerId = testPlayer.id
    console.log(`✅ Created test player: ${testPlayer.name} ${testPlayer.surname} (ID: ${testPlayerId})`)
    console.log(`   League: ${testPlayer.league}\n`)

    // TEST 1: Try to create a transfer for test player in WNC league
    console.log('TEST 1: Attempting cross-league transfer...')
    console.log(`  Creating WNC transfer for test 2 player`)

    const { error: transferError } = await supabaseAdmin
      .from('player_transfers')
      .insert({
        player_id: testPlayerId,
        league_id: wncLeagueId, // WRONG LEAGUE!
        manager_id: null,
        effective_from: new Date().toISOString(),
        transfer_type: 'trade'
      })

    if (transferError) {
      if (transferError.message.includes('Transfer league mismatch') ||
          transferError.message.includes('league') ||
          transferError.code === '23514' || transferError.code === 'P0001') {
        console.log('  ✅ TRIGGER BLOCKED IT: ' + transferError.message)
      } else {
        console.log('  ⚠️  Failed for different reason: ' + transferError.message)
      }
    } else {
      console.log('  ❌ TRIGGER MISSING: Cross-league transfer was created!')
      console.log('  Migration 016 needs to be applied!')

      // Clean up
      await supabaseAdmin
        .from('player_transfers')
        .delete()
        .eq('player_id', testPlayerId)
    }

    // TEST 2: Try to add test player to WNC squad
    console.log('\nTEST 2: Attempting cross-league squad assignment...')

    const { data: wncSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', wncLeagueId)
      .limit(1)
      .single()

    if (wncSquad) {
      console.log(`  Adding test 2 player to WNC squad`)

      const { error: squadError } = await supabaseAdmin
        .from('squad_players')
        .insert({
          squad_id: wncSquad.id,
          player_id: testPlayerId
        })

      if (squadError) {
        if (squadError.message.includes('different league') ||
            squadError.message.includes('league') ||
            squadError.code === '23514' || squadError.code === 'P0001') {
          console.log('  ✅ TRIGGER BLOCKED IT: ' + squadError.message)
        } else {
          console.log('  ⚠️  Failed for different reason: ' + squadError.message)
        }
      } else {
        console.log('  ❌ TRIGGER MISSING: Cross-league squad player was created!')
        console.log('  Migration 016 needs to be applied!')

        // Clean up
        await supabaseAdmin
          .from('squad_players')
          .delete()
          .eq('player_id', testPlayerId)
      }
    } else {
      console.log('  ⚠️  No WNC squad found, skipping test')
    }

    // TEST 3: Try to add test player to WNC lineup
    console.log('\nTEST 3: Attempting cross-league lineup...')

    const { data: wncGameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('id, week')
      .eq('league_id', wncLeagueId)
      .limit(1)
      .single()

    const { data: wncSquadWithManager } = await supabaseAdmin
      .from('squads')
      .select('manager_id')
      .eq('league_id', wncLeagueId)
      .limit(1)
      .single()

    if (wncGameweek && wncSquadWithManager?.manager_id) {
      console.log(`  Adding test 2 player to WNC gameweek ${wncGameweek.week} lineup`)

      const { error: lineupError } = await supabaseAdmin
        .from('lineups')
        .insert({
          gameweek_id: wncGameweek.id,
          manager_id: wncSquadWithManager.manager_id,
          player_ids: [testPlayerId]
        })

      if (lineupError) {
        if (lineupError.message.includes('different league') ||
            lineupError.message.includes('league') ||
            lineupError.code === '23514' || lineupError.code === 'P0001') {
          console.log('  ✅ TRIGGER BLOCKED IT: ' + lineupError.message)
        } else {
          console.log('  ⚠️  Failed for different reason: ' + lineupError.message)
        }
      } else {
        console.log('  ❌ TRIGGER MISSING: Cross-league lineup was created!')
        console.log('  Migration 016 needs to be applied!')

        // Clean up
        await supabaseAdmin
          .from('lineups')
          .delete()
          .eq('gameweek_id', wncGameweek.id)
          .eq('manager_id', wncSquadWithManager.manager_id)
      }
    } else {
      console.log('  ⚠️  No WNC gameweek or manager found, skipping test')
    }

    // TEST 4: Verify same-league operations work
    console.log('\nTEST 4: Testing valid same-league transfer...')
    console.log(`  Creating test 2 transfer for test 2 player`)

    const { error: validTransferError } = await supabaseAdmin
      .from('player_transfers')
      .insert({
        player_id: testPlayerId,
        league_id: testLeagueId, // CORRECT LEAGUE
        manager_id: null,
        effective_from: new Date().toISOString(),
        transfer_type: 'trade'
      })

    if (validTransferError) {
      console.log('  ❌ Valid same-league transfer failed:', validTransferError.message)
    } else {
      console.log('  ✅ Same-league transfer works correctly')
    }

    // Check monitoring view
    console.log('\nChecking monitoring view...')
    const { data: issues, error: viewError } = await supabaseAdmin
      .from('cross_league_data_issues')
      .select('*')

    if (viewError) {
      console.log('  ❌ Monitoring view does not exist:', viewError.message)
      console.log('  Migration 016 has NOT been applied!')
    } else {
      console.log('  ✅ Monitoring view exists')
      if (issues && issues.length > 0) {
        console.log(`  Found ${issues.length} cross-league issues (should be 0)`)
      } else {
        console.log('  No cross-league issues detected')
      }
    }

  } catch (error: any) {
    console.error('\n❌ Test error:', error.message || error)
  } finally {
    // Cleanup: Delete test player
    if (testPlayerId) {
      console.log('\nCleaning up test data...')

      // Delete any transfers first
      await supabaseAdmin
        .from('player_transfers')
        .delete()
        .eq('player_id', testPlayerId)

      // Delete the test player
      const { error: deleteError } = await supabaseAdmin
        .from('players')
        .delete()
        .eq('id', testPlayerId)

      if (deleteError) {
        console.log('⚠️  Failed to delete test player:', deleteError.message)
      } else {
        console.log('✅ Test player deleted')
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY:')
  console.log('- If all tests show "TRIGGER BLOCKED IT", migration 016 is working')
  console.log('- If tests show "TRIGGER MISSING", run migration 016 in Supabase')
  console.log('- The migration file is: supabase/migrations/016_add_league_safeguards.sql')
  console.log('='.repeat(60))
}

testTriggerEnforcement().then(() => {
  console.log('\n✅ Test complete!')
  process.exit(0)
})
