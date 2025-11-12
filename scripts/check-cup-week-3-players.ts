import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupWeek3Players() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  // Get league name
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('name')
    .eq('id', leagueId)
    .single()

  if (!league) return

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
    .select('id, cup_week, league_gameweek_id, gameweeks:league_gameweek_id(week)')
    .eq('cup_id', cup.id)
    .eq('cup_week', 3)
    .single()

  if (!cgw) return

  const gameweek = Array.isArray(cgw.gameweeks) ? cgw.gameweeks[0] : cgw.gameweeks

  console.log(`\n=== Cup Week 3 Player Analysis ===`)
  console.log(`League: ${league.name}`)
  console.log(`Cup Gameweek: ${cgw.cup_week}`)
  console.log(`League Gameweek: ${gameweek?.week}`)
  console.log(`League Gameweek ID: ${cgw.league_gameweek_id}`)

  // Get lineups
  const { data: lineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('manager_id, player_ids')
    .eq('cup_gameweek_id', cgw.id)

  console.log(`\nCup Lineups (${lineups?.length}):\n`)
  for (const lineup of lineups || []) {
    // Get manager email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', lineup.manager_id)
      .single()

    console.log(`Manager: ${user?.email}`)
    console.log(`Player IDs in lineup: ${lineup.player_ids?.join(', ')}`)

    // Get player names
    for (const playerId of lineup.player_ids || []) {
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('name, surname, league')
        .eq('id', playerId)
        .single()

      console.log(`  - ${player?.name} ${player?.surname} (league: ${player?.league})`)
    }
    console.log()
  }

  // Get all results with goals > 0 for this gameweek
  console.log(`\n=== Results with Goals in League Gameweek ${gameweek?.week} ===\n`)
  const { data: resultsWithGoals } = await supabaseAdmin
    .from('results')
    .select('player_id, goals')
    .eq('gameweek_id', cgw.league_gameweek_id)
    .gt('goals', 0)

  // Get player info for these results
  const playerIds = resultsWithGoals?.map(r => r.player_id) || []
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, manager_id, league')
    .in('id', playerIds)

  const playerMap = new Map(players?.map(p => [p.id, p]))

  for (const result of resultsWithGoals || []) {
    const player = playerMap.get(result.player_id)

    // Get manager email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', player?.manager_id)
      .single()

    console.log(`${player?.name} ${player?.surname} (${player?.league}): ${result.goals} goals - Manager: ${user?.email}`)
  }
}

checkCupWeek3Players()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
