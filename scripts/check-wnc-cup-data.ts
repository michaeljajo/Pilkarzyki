import { supabaseAdmin } from '../src/lib/supabase'

async function checkWNCCupData() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  // Get league info
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')
    .eq('id', wncLeagueId)
    .single()

  if (!league) {
    console.log('WNC League not found')
    return
  }

  console.log(`\n=== WNC LEAGUE ===`)
  console.log(`Name: ${league.name}`)
  console.log(`Season: ${league.season}`)
  console.log(`ID: ${league.id}`)

  // Get cup for the league
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', wncLeagueId)
    .single()

  if (!cup) {
    console.log('\nNo cup found for WNC league')
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
    console.log(`\n  Cup Week ${cgw.cup_week} (${cgw.stage}, Leg ${cgw.leg}) -> League Week ${gw?.week}`)

    // Check results for this gameweek
    const { data: results, count: resultCount } = await supabaseAdmin
      .from('results')
      .select('id, player_id, goals', { count: 'exact' })
      .eq('gameweek_id', cgw.league_gameweek_id)

    console.log(`    Results: ${resultCount || 0} entries`)

    // Count results with goals > 0
    const resultsWithGoals = results?.filter(r => r.goals && r.goals > 0) || []
    console.log(`    Results with goals: ${resultsWithGoals.length}`)

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

    // Sample lineup validation
    if (cupLineups && cupLineups.length > 0 && resultsWithGoals.length > 0) {
      const sampleLineup = cupLineups[0]
      console.log(`\n    VALIDATION CHECK:`)
      console.log(`    Sample lineup player IDs: ${sampleLineup.player_ids?.slice(0, 3).join(', ')}`)

      // Check if these players have results
      const { data: playerResults } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', cgw.league_gameweek_id)
        .in('player_id', sampleLineup.player_ids?.slice(0, 3) || [])

      console.log(`    Results found for lineup players: ${playerResults?.length || 0}/${sampleLineup.player_ids?.slice(0, 3).length}`)

      // Check player leagues
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('id, name, surname, league')
        .in('id', sampleLineup.player_ids?.slice(0, 3) || [])

      console.log(`    Player leagues in lineup:`)
      players?.forEach(p => {
        const result = playerResults?.find(r => r.player_id === p.id)
        console.log(`      - ${p.name} ${p.surname} (${p.league}) - ${result?.goals || 0} goals`)
      })
    }
  }

  console.log('\n' + '='.repeat(60))
}

checkWNCCupData()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
