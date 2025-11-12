import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupGroupStandingsTable() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) return

  console.log('\n=== Checking cup_group_standings Table ===\n')

  const { data: standings, error } = await supabaseAdmin
    .from('cup_group_standings')
    .select('*')
    .eq('cup_id', cup.id)

  if (error) {
    console.log('Error:', error.message)
    return
  }

  console.log(`Entries in cup_group_standings: ${standings?.length || 0}`)

  if (standings && standings.length > 0) {
    console.log('\nFirst 3 entries:')
    standings.slice(0, 3).forEach((s, i) => {
      console.log(`${i + 1}. Group ${s.group_name}: Manager ${s.manager_id}`)
      console.log(`   P:${s.played} W:${s.won} D:${s.drawn} L:${s.lost} GF:${s.goals_for} GA:${s.goals_against} GD:${s.goal_difference} Pts:${s.points}`)
    })
  } else {
    console.log('\n❌ No entries found! This is why the standings page shows "No group data".')
    console.log('\nThe cup_group_standings table needs to be populated by calculating:')
    console.log('  - Played, Won, Drawn, Lost')
    console.log('  - Goals For, Goals Against, Goal Difference')
    console.log('  - Points (3 for win, 1 for draw)')
    console.log('  - Position in group')
    console.log('  - Qualified status')
  }
}

checkCupGroupStandingsTable()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
