import { supabaseAdmin } from '../src/lib/supabase'

async function diagnoseCupWeek3() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  // Get cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', leagueId)
    .single()

  if (!cup) return

  // Get Cup Week 3
  const { data: cgw } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .eq('cup_id', cup.id)
    .eq('cup_week', 3)
    .single()

  if (!cgw) {
    console.log('Cup Week 3 not found')
    return
  }

  console.log(`\n=== Cup Week 3 Diagnosis ===`)
  console.log(`Cup Gameweek ID: ${cgw.id}`)
  console.log(`League Gameweek ID: ${cgw.league_gameweek_id}`)

  // Get lineups
  const { data: lineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('id, manager_id, player_ids')
    .eq('cup_gameweek_id', cgw.id)

  console.log(`\nLineups (${lineups?.length || 0}):`)
  for (const lineup of lineups || []) {
    console.log(`  Manager: ${lineup.manager_id}`)
    console.log(`  Player IDs: ${lineup.player_ids?.join(', ')}`)

    // Get results for these players
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('player_id, goals, has_played')
      .eq('gameweek_id', cgw.league_gameweek_id)
      .in('player_id', lineup.player_ids || [])

    console.log(`  Results found: ${results?.length || 0}`)
    for (const result of results || []) {
      // Get player name
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('name, surname')
        .eq('id', result.player_id)
        .single()

      console.log(`    - ${player?.name} ${player?.surname}: ${result.goals} goals (played: ${result.has_played})`)
    }
    console.log()
  }

  // Get matches
  const { data: matches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, home_manager_id, away_manager_id, home_score, away_score')
    .eq('cup_gameweek_id', cgw.id)

  console.log(`\nMatches (${matches?.length || 0}):`)
  for (const match of matches || []) {
    console.log(`  Match: ${match.home_score} - ${match.away_score}`)
    console.log(`    Home Manager: ${match.home_manager_id}`)
    console.log(`    Away Manager: ${match.away_manager_id}`)
  }

  // Check all results for this league gameweek
  const { data: allResults, count } = await supabaseAdmin
    .from('results')
    .select('player_id, goals, has_played', { count: 'exact' })
    .eq('gameweek_id', cgw.league_gameweek_id)

  console.log(`\nTotal results in league gameweek ${cgw.league_gameweek_id}: ${count}`)

  // Check if any have goals > 0
  const resultsWithGoals = allResults?.filter(r => r.goals && r.goals > 0) || []
  console.log(`Results with goals > 0: ${resultsWithGoals.length}`)
}

diagnoseCupWeek3()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
