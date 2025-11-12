import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupWeeks1And2() {
  const leagueId = '791f04ae-290b-4aed-8cc7-6070beaefa3a'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', leagueId)
    .single()

  if (!cup) return

  for (const cupWeek of [1, 2]) {
    const { data: cgw } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, cup_week, league_gameweek_id')
      .eq('cup_id', cup.id)
      .eq('cup_week', cupWeek)
      .single()

    if (!cgw) continue

    console.log(`\n=== Cup Week ${cupWeek} ===`)

    // Get one lineup
    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('manager_id, player_ids')
      .eq('cup_gameweek_id', cgw.id)
      .limit(1)

    if (lineups && lineups.length > 0) {
      const lineup = lineups[0]

      // Get manager email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', lineup.manager_id)
        .single()

      console.log(`Sample Manager: ${user?.email}`)
      console.log(`Player IDs: ${lineup.player_ids?.slice(0, 3).join(', ')}`)

      // Get player details
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('name, surname, league')
        .in('id', lineup.player_ids?.slice(0, 3) || [])

      console.log('Players in lineup:')
      players?.forEach(p => console.log(`  - ${p.name} ${p.surname} (${p.league})`))

      // Check results
      const { data: results } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', cgw.league_gameweek_id)
        .in('player_id', lineup.player_ids?.slice(0, 3) || [])

      console.log(`Results found: ${results?.length || 0}`)
      for (const result of results || []) {
        const player = players?.find(p => p.name === result.player_id)
        console.log(`  - Goals: ${result.goals}`)
      }
    }
  }
}

checkCupWeeks1And2()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
