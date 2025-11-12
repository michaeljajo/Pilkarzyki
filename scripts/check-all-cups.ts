import { supabaseAdmin } from '../src/lib/supabase'

async function checkAllCups() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cups } = await supabaseAdmin
    .from('cups')
    .select('id, name, created_at')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })

  console.log(`\n=== All WNC Cups ===\n`)

  for (const cup of cups || []) {
    console.log(`Cup: ${cup.name}`)
    console.log(`ID: ${cup.id}`)
    console.log(`Created: ${cup.created_at}`)

    const { data: gameweeks } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id')
      .eq('cup_id', cup.id)

    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('id')
      .in('cup_gameweek_id', gameweeks?.map(g => g.id) || [])

    console.log(`Gameweeks: ${gameweeks?.length || 0}`)
    console.log(`Lineups: ${lineups?.length || 0}`)
    console.log()
  }
}

checkAllCups()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
