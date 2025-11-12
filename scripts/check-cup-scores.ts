import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupScores() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) return

  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week')
    .eq('cup_id', cup.id)
    .order('cup_week')
    .limit(4)

  console.log(`\n=== Cup Match Scores ===`)
  console.log(`Cup: ${cup.name}\n`)

  for (const cgw of cupGameweeks || []) {
    const { data: matches } = await supabaseAdmin
      .from('cup_matches')
      .select('id, home_manager_id, away_manager_id, home_score, away_score')
      .eq('cup_gameweek_id', cgw.id)
      .limit(3)

    console.log(`Cup Week ${cgw.cup_week}:`)

    for (const match of matches || []) {
      const { data: homeUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', match.home_manager_id)
        .single()

      const { data: awayUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', match.away_manager_id)
        .single()

      const homeEmail = homeUser?.email?.split('@')[0] || 'Unknown'
      const awayEmail = awayUser?.email?.split('@')[0] || 'Unknown'

      console.log(`  ${homeEmail} ${match.home_score ?? '?'}-${match.away_score ?? '?'} ${awayEmail}`)
    }
    console.log()
  }
}

checkCupScores()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
