import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupWeek2PlayerNames() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .single()

  if (!cup) return

  const { data: cgw } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week')
    .eq('cup_id', cup.id)
    .eq('cup_week', 2)
    .single()

  if (!cgw) return

  console.log(`\n=== Cup Week 2 Player Name Verification ===\n`)

  // Get lineups
  const { data: lineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('manager_id, player_ids')
    .eq('cup_gameweek_id', cgw.id)
    .limit(5)

  for (const lineup of lineups || []) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', lineup.manager_id)
      .single()

    console.log(`Manager: ${user?.email}`)

    // Get player names
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, league')
      .in('id', lineup.player_ids || [])

    console.log(`Players in Cup Lineup:`)
    players?.forEach(p => {
      console.log(`  - ${p.name} ${p.surname} (${p.league})`)
    })
    console.log()
  }

  console.log(`\n💡 Based on your screenshot, Cup Week 2 should have players like:`)
  console.log(`  - Youssef En-Nesyri`)
  console.log(`  - Jonatan Braut Brunes`)
  console.log(`  - Amine El Ouazzani`)
  console.log(`  - etc.`)
  console.log(`\nDo the names above match your migration file?`)
}

checkCupWeek2PlayerNames()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
