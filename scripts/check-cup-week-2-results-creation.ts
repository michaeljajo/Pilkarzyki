import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupWeek2ResultsCreation() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .single()

  if (!cup) return

  const { data: cgw } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .eq('cup_id', cup.id)
    .eq('cup_week', 2)
    .single()

  if (!cgw) return

  console.log(`\n=== Cup Week 2 Results Investigation ===\n`)

  // Get ALL cup lineups for this cup week
  const { data: allLineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('manager_id, player_ids')
    .eq('cup_gameweek_id', cgw.id)

  console.log(`Total cup lineups: ${allLineups?.length}\n`)

  // Get all unique player IDs from all lineups
  const allPlayerIds = new Set<string>()
  allLineups?.forEach(lineup => {
    lineup.player_ids?.forEach((id: string) => allPlayerIds.add(id))
  })

  console.log(`Total unique players in cup lineups: ${allPlayerIds.size}\n`)

  // Check how many of these players have results in the league gameweek
  const { data: results } = await supabaseAdmin
    .from('results')
    .select('player_id, goals, has_played')
    .eq('gameweek_id', cgw.league_gameweek_id)
    .in('player_id', Array.from(allPlayerIds))

  console.log(`Results found for cup lineup players: ${results?.length}/${allPlayerIds.size}\n`)

  const resultsMap = new Map(results?.map(r => [r.player_id, r]))

  // Break down by goals
  let withGoals = 0
  let withZeroGoals = 0
  let noResult = 0

  for (const playerId of allPlayerIds) {
    const result = resultsMap.get(playerId)
    if (!result) {
      noResult++
    } else if (result.goals && result.goals > 0) {
      withGoals++
    } else {
      withZeroGoals++
    }
  }

  console.log(`Breakdown:`)
  console.log(`  - Players with goals > 0: ${withGoals}`)
  console.log(`  - Players with 0 goals: ${withZeroGoals}`)
  console.log(`  - Players with NO result record: ${noResult}`)

  console.log(`\n\n⚠️ CRITICAL FINDING:`)
  if (noResult > 0) {
    console.log(`${noResult} players in cup lineups have NO result records at all!`)
    console.log(`This means the migration import did NOT create results for these players.`)
    console.log(`\nPossible causes:`)
    console.log(`  1. Migration file didn't specify goals for these players`)
    console.log(`  2. Import process failed to create results`)
    console.log(`  3. Results were created in wrong gameweek`)
  } else {
    console.log(`All players have result records (even if 0 goals).`)
    console.log(`This is expected if those players were in lineups but didn't score.`)
  }

  // Now check: are there OTHER results in this gameweek that aren't in cup lineups?
  const { data: allGameweekResults } = await supabaseAdmin
    .from('results')
    .select('player_id, goals')
    .eq('gameweek_id', cgw.league_gameweek_id)
    .gt('goals', 0)

  const resultsNotInCup = allGameweekResults?.filter(r => !allPlayerIds.has(r.player_id)) || []

  console.log(`\n\n📊 Results with goals NOT in cup lineups: ${resultsNotInCup.length}`)

  if (resultsNotInCup.length > 0) {
    console.log(`\nThese players scored but were NOT in cup lineups:`)
    for (const result of resultsNotInCup.slice(0, 10)) {
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('name, surname, manager_id')
        .eq('id', result.player_id)
        .single()

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', player?.manager_id)
        .single()

      console.log(`  - ${player?.name} ${player?.surname}: ${result.goals} goals (manager: ${user?.email})`)
    }

    console.log(`\n💡 This is expected: these players either:`)
    console.log(`   a) Were in LEAGUE lineups but not CUP lineups (correct)`)
    console.log(`   b) Should have been in cup lineups but migration file was wrong`)
  }
}

checkCupWeek2ResultsCreation()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
