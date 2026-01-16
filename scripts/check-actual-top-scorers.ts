/**
 * Check what the top scorers API actually returns
 */

import { supabaseAdmin } from '../src/lib/supabase'
import { batchGetManagersAtGameweek } from '../src/utils/transfer-resolver'

async function checkTopScorers() {
  console.log('🔍 Checking top scorers data...\n')

  try {
    // Check all leagues
    const { data: leagues } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .order('name')

    for (const league of leagues || []) {
      console.log(`\n========== ${league.name} ==========`)

      // Get gameweeks
      const { data: gameweeks } = await supabaseAdmin
        .from('gameweeks')
        .select('id, week')
        .eq('league_id', league.id)

      if (!gameweeks || gameweeks.length === 0) {
        console.log('No gameweeks found')
        continue
      }

      const gameweekIds = gameweeks.map(gw => gw.id)
      console.log(`Gameweeks: ${gameweeks.length}`)

      // Get lineups
      const { data: lineups } = await supabaseAdmin
        .from('lineups')
        .select('player_ids, gameweek_id')
        .in('gameweek_id', gameweekIds)

      const leaguePlayersSet = new Set<string>()
      lineups?.forEach((lineup) => {
        lineup.player_ids?.forEach((playerId: string) => {
          leaguePlayersSet.add(`${lineup.gameweek_id}_${playerId}`)
        })
      })

      console.log(`Players in lineups: ${leaguePlayersSet.size}`)

      // Get results
      const { data: results } = await supabaseAdmin
        .from('results')
        .select('player_id, goals, gameweek_id')
        .in('gameweek_id', gameweekIds)
        .gt('goals', 0)

      console.log(`Results with goals: ${results?.length || 0}`)

      // Filter to only lineup players
      const filteredResults = results?.filter(r =>
        leaguePlayersSet.has(`${r.gameweek_id}_${r.player_id}`)
      ) || []

      console.log(`Results for lineup players: ${filteredResults.length}`)

      if (filteredResults.length === 0) {
        console.log('❌ No goal scorers found in this league')
        continue
      }

      // Group by gameweek and resolve managers
      const gameweekResultsMap = new Map<string, typeof results>()
      filteredResults.forEach(result => {
        if (!gameweekResultsMap.has(result.gameweek_id)) {
          gameweekResultsMap.set(result.gameweek_id, [])
        }
        gameweekResultsMap.get(result.gameweek_id)!.push(result)
      })

      // Resolve managers
      const playerManagerMap = new Map<string, string | null>()

      for (const [gameweekId, gwResults] of gameweekResultsMap.entries()) {
        const playerIds = gwResults.map(r => r.player_id)
        console.log(`\n  Resolving ${playerIds.length} players for gameweek ${gameweekId}...`)

        const managerMap = await batchGetManagersAtGameweek(playerIds, gameweekId, league.id)

        for (const [playerId, managerId] of managerMap.entries()) {
          playerManagerMap.set(playerId, managerId)
        }
      }

      // Count unassigned
      let assignedCount = 0
      let unassignedCount = 0

      for (const [playerId, managerId] of playerManagerMap.entries()) {
        if (managerId) {
          assignedCount++
        } else {
          unassignedCount++
        }
      }

      console.log(`\n  ✅ Assigned to managers: ${assignedCount}`)
      console.log(`  ❌ Unassigned: ${unassignedCount}`)

      if (unassignedCount > 0) {
        console.log('\n  Unassigned players:')
        const unassignedPlayerIds = Array.from(playerManagerMap.entries())
          .filter(([_, managerId]) => !managerId)
          .map(([playerId]) => playerId)
          .slice(0, 10)

        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, name, surname, manager_id, league')
          .in('id', unassignedPlayerIds)

        players?.forEach(p => {
          console.log(`    - ${p.name} ${p.surname} (league: ${p.league}, manager_id: ${p.manager_id})`)
        })

        // Check if these players have transfers
        for (const playerId of unassignedPlayerIds.slice(0, 5)) {
          const { data: transfers, count } = await supabaseAdmin
            .from('player_transfers')
            .select('*', { count: 'exact' })
            .eq('player_id', playerId)
            .eq('league_id', league.id)

          const player = players?.find(p => p.id === playerId)
          console.log(`      ${player?.name} ${player?.surname}: ${count} transfers in this league`)
        }
      }
    }

  } catch (error: any) {
    console.error('\n❌ Check failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

checkTopScorers().then(() => {
  console.log('\n✅ Check complete!')
  process.exit(0)
})
