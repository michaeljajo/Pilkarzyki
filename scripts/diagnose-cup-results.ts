import { supabaseAdmin } from '../src/lib/supabase'

async function diagnoseCupResults() {
  console.log('=== Comprehensive Cup Results Diagnosis ===\n')

  // 1. Check cup matches
  const { data: cupMatches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, cup_gameweek_id, home_manager_id, away_manager_id, home_score, away_score, is_completed')
    .order('cup_gameweek_id')

  console.log(`\n1. Cup Matches: ${cupMatches?.length || 0} found`)

  if (cupMatches && cupMatches.length > 0) {
    const completedMatches = cupMatches.filter(m => m.is_completed)
    const zeroScoreMatches = cupMatches.filter(m => m.home_score === 0 && m.away_score === 0)
    console.log(`   - Completed: ${completedMatches.length}`)
    console.log(`   - 0-0 scores: ${zeroScoreMatches.length}`)

    // Show first few matches
    console.log('\n   Sample matches:')
    cupMatches.slice(0, 3).forEach(m => {
      console.log(`   Match ${m.id}: ${m.home_score}-${m.away_score} (completed: ${m.is_completed})`)
    })
  }

  // 2. Check cup lineups
  const { data: cupLineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('id, manager_id, cup_gameweek_id, player_ids')

  console.log(`\n2. Cup Lineups: ${cupLineups?.length || 0} found`)

  if (cupLineups && cupLineups.length > 0) {
    console.log(`   Sample lineups:`)
    cupLineups.slice(0, 3).forEach(l => {
      console.log(`   Lineup ${l.id}: ${l.player_ids?.length || 0} players`)
    })
  }

  // 3. Check cup gameweeks and their corresponding league gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id, stage, leg')
    .order('cup_week')

  console.log(`\n3. Cup Gameweeks: ${cupGameweeks?.length || 0} found`)

  // 4. For the first completed cup match, check if results exist
  if (cupMatches && cupMatches.length > 0) {
    const firstMatch = cupMatches[0]
    console.log(`\n4. Deep dive into match ${firstMatch.id}:`)
    console.log(`   Cup Gameweek ID: ${firstMatch.cup_gameweek_id}`)

    // Get cup gameweek details
    const { data: cupGW } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('cup_week, league_gameweek_id')
      .eq('id', firstMatch.cup_gameweek_id)
      .single()

    if (cupGW) {
      console.log(`   Cup Week: ${cupGW.cup_week}`)
      console.log(`   League Gameweek ID: ${cupGW.league_gameweek_id}`)

      // Check home lineup
      const { data: homeLineup } = await supabaseAdmin
        .from('cup_lineups')
        .select('player_ids')
        .eq('manager_id', firstMatch.home_manager_id)
        .eq('cup_gameweek_id', firstMatch.cup_gameweek_id)
        .single()

      console.log(`\n   Home lineup: ${homeLineup ? `${homeLineup.player_ids.length} players` : 'NOT FOUND'}`)

      if (homeLineup?.player_ids) {
        console.log(`   Player IDs: ${homeLineup.player_ids.join(', ')}`)

        // Check results for these players
        const { data: homeResults } = await supabaseAdmin
          .from('results')
          .select('id, player_id, goals, gameweek_id')
          .eq('gameweek_id', cupGW.league_gameweek_id)
          .in('player_id', homeLineup.player_ids)

        console.log(`   Results found: ${homeResults?.length || 0}`)
        if (homeResults && homeResults.length > 0) {
          homeResults.forEach(r => {
            console.log(`     - Player ${r.player_id}: ${r.goals} goals (result ID: ${r.id})`)
          })
        } else {
          console.log(`   ❌ NO RESULTS FOUND for these players in gameweek ${cupGW.league_gameweek_id}`)

          // Check if results exist in other gameweeks
          const { data: anyResults } = await supabaseAdmin
            .from('results')
            .select('id, player_id, goals, gameweek_id')
            .in('player_id', homeLineup.player_ids)
            .limit(10)

          if (anyResults && anyResults.length > 0) {
            console.log(`   But found results in other gameweeks:`)
            anyResults.slice(0, 5).forEach(r => {
              console.log(`     - Player ${r.player_id}: ${r.goals} goals in gameweek ${r.gameweek_id}`)
            })
          }
        }
      }

      // Check away lineup
      const { data: awayLineup } = await supabaseAdmin
        .from('cup_lineups')
        .select('player_ids')
        .eq('manager_id', firstMatch.away_manager_id)
        .eq('cup_gameweek_id', firstMatch.cup_gameweek_id)
        .single()

      console.log(`\n   Away lineup: ${awayLineup ? `${awayLineup.player_ids.length} players` : 'NOT FOUND'}`)

      if (awayLineup?.player_ids) {
        console.log(`   Player IDs: ${awayLineup.player_ids.join(', ')}`)

        // Check results for these players
        const { data: awayResults } = await supabaseAdmin
          .from('results')
          .select('id, player_id, goals')
          .eq('gameweek_id', cupGW.league_gameweek_id)
          .in('player_id', awayLineup.player_ids)

        console.log(`   Results found: ${awayResults?.length || 0}`)
        if (awayResults && awayResults.length > 0) {
          awayResults.forEach(r => {
            console.log(`     - Player ${r.player_id}: ${r.goals} goals`)
          })
        }
      }
    }
  }

  // 5. Check ALL results across all gameweeks
  const { data: allGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .order('week')

  console.log(`\n5. Checking results across all league gameweeks:`)

  if (allGameweeks) {
    for (const gw of allGameweeks.slice(0, 5)) {
      const { count } = await supabaseAdmin
        .from('results')
        .select('id', { count: 'exact', head: true })
        .eq('gameweek_id', gw.id)

      console.log(`   Gameweek ${gw.week}: ${count || 0} results`)
    }
  }

  console.log('\n=== Diagnosis Complete ===')
}

diagnoseCupResults().catch(console.error)
