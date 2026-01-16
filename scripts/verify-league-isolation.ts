/**
 * Verify League Data Isolation
 * Checks that no data is mixed between leagues
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function verifyIsolation() {
  console.log('🔍 Verifying League Data Isolation\n')

  let issuesFound = 0

  try {
    // 1. Check for cross-league transfers
    console.log('1. Checking for cross-league transfers...')
    const { data: crossTransfers } = await supabaseAdmin
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

    let transferIssues = 0
    for (const transfer of crossTransfers || []) {
      const player = Array.isArray(transfer.players) ? transfer.players[0] : transfer.players
      const league = Array.isArray(transfer.leagues) ? transfer.leagues[0] : transfer.leagues

      if (player && league && player.league !== league.name) {
        transferIssues++
        if (transferIssues <= 5) {
          console.log(`  ❌ Player ${player.name} ${player.surname} (${player.league}) has transfer in ${league.name}`)
        }
      }
    }

    if (transferIssues > 0) {
      console.log(`  ❌ Found ${transferIssues} cross-league transfer issues!`)
      issuesFound += transferIssues
    } else {
      console.log(`  ✅ All ${crossTransfers?.length} transfers are league-consistent`)
    }

    // 2. Check for cross-league squad players
    console.log('\n2. Checking for cross-league squad players...')
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('id, league_id, leagues:league_id(name)')

    let squadIssues = 0
    for (const squad of squads || []) {
      const { data: squadPlayers } = await supabaseAdmin
        .from('squad_players')
        .select(`
          id,
          player_id,
          players:player_id (
            name,
            surname,
            league
          )
        `)
        .eq('squad_id', squad.id)

      const squadLeague = Array.isArray(squad.leagues) ? squad.leagues[0] : squad.leagues

      for (const sp of squadPlayers || []) {
        const player = Array.isArray(sp.players) ? sp.players[0] : sp.players

        if (player && squadLeague && player.league !== squadLeague.name) {
          squadIssues++
          if (squadIssues <= 5) {
            console.log(`  ❌ Squad in ${squadLeague.name} contains player ${player.name} ${player.surname} from ${player.league}`)
          }
        }
      }
    }

    if (squadIssues > 0) {
      console.log(`  ❌ Found ${squadIssues} cross-league squad issues!`)
      issuesFound += squadIssues
    } else {
      console.log(`  ✅ All squads contain only players from their league`)
    }

    // 3. Check for cross-league lineups
    console.log('\n3. Checking for cross-league lineups...')
    const { data: gameweeks } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, leagues:league_id(name)')
      .limit(100)

    let lineupIssues = 0
    for (const gw of gameweeks || []) {
      const { data: lineups } = await supabaseAdmin
        .from('lineups')
        .select('id, player_ids')
        .eq('gameweek_id', gw.id)

      const gwLeague = Array.isArray(gw.leagues) ? gw.leagues[0] : gw.leagues

      for (const lineup of lineups || []) {
        if (!lineup.player_ids || lineup.player_ids.length === 0) continue

        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, name, surname, league')
          .in('id', lineup.player_ids)

        for (const player of players || []) {
          if (gwLeague && player.league !== gwLeague.name) {
            lineupIssues++
            if (lineupIssues <= 5) {
              console.log(`  ❌ Lineup in ${gwLeague.name} gameweek contains player ${player.name} ${player.surname} from ${player.league}`)
            }
          }
        }
      }
    }

    if (lineupIssues > 0) {
      console.log(`  ❌ Found ${lineupIssues} cross-league lineup issues!`)
      issuesFound += lineupIssues
    } else {
      console.log(`  ✅ All lineups contain only players from their league`)
    }

    // 4. Check league counts
    console.log('\n4. League data summary...')
    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .order('name')

    for (const league of leagues || []) {
      const { count: playerCount } = await supabaseAdmin
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('league', league.name)

      const { count: transferCount } = await supabaseAdmin
        .from('player_transfers')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)

      const { count: gwCount } = await supabaseAdmin
        .from('gameweeks')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id)

      console.log(`  ${league.name}:`)
      console.log(`    Players: ${playerCount}`)
      console.log(`    Transfers: ${transferCount}`)
      console.log(`    Gameweeks: ${gwCount}`)
    }

    // 5. Summary
    console.log('\n' + '='.repeat(50))
    if (issuesFound === 0) {
      console.log('✅ VERIFICATION PASSED')
      console.log('   No cross-league data issues found!')
      console.log('   All leagues are properly isolated.')
    } else {
      console.log('❌ VERIFICATION FAILED')
      console.log(`   Found ${issuesFound} cross-league data issues!`)
      console.log('   Review the output above for details.')
    }
    console.log('='.repeat(50))

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

verifyIsolation().then(() => {
  console.log('\n✅ Verification complete!')
  process.exit(0)
})
