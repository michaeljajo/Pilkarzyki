import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupResults() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  // Get cup for the league
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', leagueId)
    .single()

  if (!cup) {
    console.log('No cup found for this league')
    return
  }

  console.log(`\n=== CUP: ${cup.name} ===\n`)

  // Get all cup gameweeks with their league gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select(`
      id,
      cup_week,
      stage,
      leg,
      league_gameweek_id,
      gameweeks:league_gameweek_id (
        id,
        week,
        is_completed
      )
    `)
    .eq('cup_id', cup.id)
    .order('cup_week', { ascending: true })

  console.log('Cup Gameweeks:')
  for (const cgw of cupGameweeks || []) {
    const gw = Array.isArray(cgw.gameweeks) ? cgw.gameweeks[0] : cgw.gameweeks
    console.log(`  Cup Week ${cgw.cup_week} (${cgw.stage}, Leg ${cgw.leg}) -> League Week ${gw?.week}`)

    // Check results for this gameweek
    const { data: results, count } = await supabaseAdmin
      .from('results')
      .select('id, player_id, goals', { count: 'exact' })
      .eq('gameweek_id', cgw.league_gameweek_id)

    console.log(`    Results: ${count || 0} entries`)

    // Check cup lineups for this cup gameweek
    const { data: cupLineups, count: lineupCount } = await supabaseAdmin
      .from('cup_lineups')
      .select('id, manager_id, player_ids', { count: 'exact' })
      .eq('cup_gameweek_id', cgw.id)

    console.log(`    Cup Lineups: ${lineupCount || 0} entries`)

    // Check cup matches for this cup gameweek
    const { data: cupMatches, count: matchCount } = await supabaseAdmin
      .from('cup_matches')
      .select('id, home_manager_id, away_manager_id, home_score, away_score, is_completed', { count: 'exact' })
      .eq('cup_gameweek_id', cgw.id)

    console.log(`    Cup Matches: ${matchCount || 0} entries`)
    if (cupMatches && cupMatches.length > 0) {
      cupMatches.forEach(m => {
        console.log(`      Match: ${m.home_score || 0} - ${m.away_score || 0} (completed: ${m.is_completed})`)
      })
    }
    console.log()
  }

  // Check if there are results in league gameweeks that might not be linked
  console.log('\n=== ALL LEAGUE GAMEWEEKS WITH RESULTS ===\n')
  const { data: allGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .eq('league_id', leagueId)
    .order('week', { ascending: true })

  for (const gw of allGameweeks || []) {
    const { count } = await supabaseAdmin
      .from('results')
      .select('id', { count: 'exact' })
      .eq('gameweek_id', gw.id)

    if (count && count > 0) {
      console.log(`  League Week ${gw.week}: ${count} results`)
    }
  }
}

checkCupResults()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
