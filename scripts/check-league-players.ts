import { supabaseAdmin } from '../src/lib/supabase'

async function checkLeaguePlayers() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')
    .eq('id', leagueId)
    .single()

  console.log('\n=== League Info ===')
  console.log('League:', league)

  // Check what league value players have for managers in this league
  const { data: squads } = await supabaseAdmin
    .from('squads')
    .select('manager_id')
    .eq('league_id', leagueId)
    .limit(1)

  if (squads && squads.length > 0) {
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('league')
      .eq('manager_id', squads[0].manager_id)
      .limit(5)

    console.log('\nSample player league values for managers in this league:')
    players?.forEach(p => console.log(`  - ${p.league}`))
  }

  // Count players by league value
  const { data: allPlayers } = await supabaseAdmin
    .from('players')
    .select('league, manager_id')

  const leagueCount = new Map<string, number>()
  allPlayers?.forEach(p => {
    leagueCount.set(p.league, (leagueCount.get(p.league) || 0) + 1)
  })

  console.log('\nPlayer counts by league value:')
  for (const [leagueName, count] of leagueCount.entries()) {
    console.log(`  ${leagueName}: ${count} players`)
  }
}

checkLeaguePlayers()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
