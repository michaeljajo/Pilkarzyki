/**
 * Check which leagues have data
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function checkLeagues() {
  const { data: leagues } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .order('name')

  if (!leagues) {
    console.log('No leagues found')
    return
  }

  console.log('Leagues with player counts:\n')

  for (const league of leagues) {
    const { count: playerCount } = await supabaseAdmin
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('league', league.name)

    const { count: squadCount } = await supabaseAdmin
      .from('squads')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)

    console.log(`${league.name}:`)
    console.log(`  Players: ${playerCount || 0}`)
    console.log(`  Squads: ${squadCount || 0}`)
  }
}

checkLeagues().then(() => process.exit(0))
