import { supabaseAdmin } from '../src/lib/supabase'

async function checkLineupMatches() {
  console.log('=== Checking Lineup-Match Associations ===\n')

  // Get all cup lineups
  const { data: cupLineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('id, manager_id, cup_gameweek_id, player_ids')

  console.log(`Found ${cupLineups?.length || 0} cup lineups\n`)

  // Group lineups by cup_gameweek_id and manager_id
  const lineupsByGameweek = new Map<string, any[]>()

  cupLineups?.forEach(lineup => {
    const key = lineup.cup_gameweek_id
    if (!lineupsByGameweek.has(key)) {
      lineupsByGameweek.set(key, [])
    }
    lineupsByGameweek.get(key)!.push(lineup)
  })

  console.log(`Lineups distributed across ${lineupsByGameweek.size} cup gameweeks\n`)

  // For each cup gameweek with lineups, check if matches exist
  for (const [cupGameweekId, lineups] of lineupsByGameweek.entries()) {
    console.log(`\nCup Gameweek ${cupGameweekId}: ${lineups.length} lineups`)

    // Get cup gameweek details
    const { data: cupGW } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('cup_week, league_gameweek_id, stage, leg')
      .eq('id', cupGameweekId)
      .single()

    if (cupGW) {
      console.log(`  Cup Week ${cupGW.cup_week}, Stage: ${cupGW.stage}, Leg: ${cupGW.leg}`)
      console.log(`  League Gameweek: ${cupGW.league_gameweek_id}`)

      // Get matches for this cup gameweek
      const { data: matches } = await supabaseAdmin
        .from('cup_matches')
        .select('id, home_manager_id, away_manager_id, home_score, away_score, is_completed')
        .eq('cup_gameweek_id', cupGameweekId)

      console.log(`  Matches: ${matches?.length || 0}`)

      if (matches && matches.length > 0) {
        // Check first match in detail
        const match = matches[0]
        console.log(`\n  Checking Match ${match.id}:`)
        console.log(`    Home Manager: ${match.home_manager_id}`)
        console.log(`    Away Manager: ${match.away_manager_id}`)
        console.log(`    Score: ${match.home_score}-${match.away_score}`)
        console.log(`    Completed: ${match.is_completed}`)

        // Find lineups for this match
        const homeLineup = lineups.find(l => l.manager_id === match.home_manager_id)
        const awayLineup = lineups.find(l => l.manager_id === match.away_manager_id)

        console.log(`    Home Lineup: ${homeLineup ? `Found (${homeLineup.player_ids.length} players)` : 'NOT FOUND'}`)
        console.log(`    Away Lineup: ${awayLineup ? `Found (${awayLineup.player_ids.length} players)` : 'NOT FOUND'}`)

        if (homeLineup) {
          console.log(`      Home Players: ${homeLineup.player_ids.join(', ')}`)

          // Check results
          const { data: homeResults } = await supabaseAdmin
            .from('results')
            .select('id, player_id, goals')
            .eq('gameweek_id', cupGW.league_gameweek_id)
            .in('player_id', homeLineup.player_ids)

          console.log(`      Home Results: ${homeResults?.length || 0} found`)
          if (homeResults && homeResults.length > 0) {
            homeResults.forEach(r => {
              console.log(`        - Player ${r.player_id}: ${r.goals} goals`)
            })
            const totalGoals = homeResults.reduce((sum, r) => sum + (r.goals || 0), 0)
            console.log(`      Total Home Goals: ${totalGoals}`)
          }
        }

        if (awayLineup) {
          console.log(`      Away Players: ${awayLineup.player_ids.join(', ')}`)

          // Check results
          const { data: awayResults } = await supabaseAdmin
            .from('results')
            .select('id, player_id, goals')
            .eq('gameweek_id', cupGW.league_gameweek_id)
            .in('player_id', awayLineup.player_ids)

          console.log(`      Away Results: ${awayResults?.length || 0} found`)
          if (awayResults && awayResults.length > 0) {
            awayResults.forEach(r => {
              console.log(`        - Player ${r.player_id}: ${r.goals} goals`)
            })
            const totalGoals = awayResults.reduce((sum, r) => sum + (r.goals || 0), 0)
            console.log(`      Total Away Goals: ${totalGoals}`)
          }
        }

        // Only check first gameweek in detail
        break
      }
    }
  }

  console.log('\n=== Done ===')
}

checkLineupMatches().catch(console.error)
