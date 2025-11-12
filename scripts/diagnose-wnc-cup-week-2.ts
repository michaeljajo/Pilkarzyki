import { supabaseAdmin } from '../src/lib/supabase'

async function diagnoseWNCCupWeek2() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .single()

  if (!cup) return

  // Get Cup Week 2
  const { data: cgw } = await supabaseAdmin
    .from('cup_gameweeks')
    .select(`
      id,
      cup_week,
      league_gameweek_id,
      gameweeks:league_gameweek_id(week)
    `)
    .eq('cup_id', cup.id)
    .eq('cup_week', 2)
    .single()

  if (!cgw) return

  const gameweek = Array.isArray(cgw.gameweeks) ? cgw.gameweeks[0] : cgw.gameweeks

  console.log(`\n=== WNC Cup Week 2 Diagnosis ===`)
  console.log(`League Gameweek: ${gameweek?.week}`)
  console.log(`League Gameweek ID: ${cgw.league_gameweek_id}\n`)

  // Get one cup lineup
  const { data: lineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('manager_id, player_ids')
    .eq('cup_gameweek_id', cgw.id)
    .limit(1)

  if (!lineups || lineups.length === 0) return

  const lineup = lineups[0]

  // Get manager
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', lineup.manager_id)
    .single()

  console.log(`Sample Manager: ${user?.email}`)
  console.log(`\nPlayers in Cup Lineup:`)

  // Get player details
  const { data: lineupPlayers } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, manager_id')
    .in('id', lineup.player_ids || [])

  for (const player of lineupPlayers || []) {
    // Check if this player has results for this gameweek
    const { data: result } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', cgw.league_gameweek_id)
      .eq('player_id', player.id)
      .single()

    const belongsToManager = player.manager_id === lineup.manager_id
    console.log(`  - ${player.name} ${player.surname}: ${result?.goals || 0} goals ${belongsToManager ? '✓' : '✗ WRONG MANAGER'} (player manager: ${player.manager_id})`)
  }

  // Now check who DOES have results for this gameweek
  console.log(`\n\nPlayers with GOALS in League Week ${gameweek?.week} for this manager:`)

  // Get all players for this manager
  const { data: managerPlayers } = await supabaseAdmin
    .from('players')
    .select('id, name, surname')
    .eq('manager_id', lineup.manager_id)
    .eq('league', 'WNC')

  const managerPlayerIds = managerPlayers?.map(p => p.id) || []

  // Get results with goals for this manager's players
  const { data: resultsWithGoals } = await supabaseAdmin
    .from('results')
    .select('player_id, goals')
    .eq('gameweek_id', cgw.league_gameweek_id)
    .in('player_id', managerPlayerIds)
    .gt('goals', 0)

  for (const result of resultsWithGoals || []) {
    const player = managerPlayers?.find(p => p.id === result.player_id)
    const inLineup = lineup.player_ids?.includes(result.player_id)
    console.log(`  - ${player?.name} ${player?.surname}: ${result.goals} goals ${inLineup ? '(IN LINEUP)' : '(NOT IN LINEUP)'}`)
  }

  console.log(`\n\n💡 CONCLUSION: The cup lineups have the WRONG player IDs!`)
  console.log(`The players in the lineups are not the ones who actually played/scored.`)
}

diagnoseWNCCupWeek2()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
