import { supabaseAdmin } from '../src/lib/supabase'

async function checkCupStatus() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('*')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) {
    console.log('No cup found!')
    return
  }

  console.log('\n=== Cup Status ===')
  console.log(`Name: ${cup.name}`)
  console.log(`ID: ${cup.id}`)
  console.log(`Stage: ${cup.stage}`)
  console.log(`Is Active: ${cup.is_active}`)
  console.log(`Created: ${cup.created_at}`)
  console.log()

  // Check cup groups
  const { data: groups } = await supabaseAdmin
    .from('cup_groups')
    .select('group_name, manager_id')
    .eq('cup_id', cup.id)

  console.log(`=== Cup Groups ===`)
  console.log(`Total entries: ${groups?.length || 0}`)

  const groupNames = [...new Set(groups?.map(g => g.group_name))]
  console.log(`Unique groups: ${groupNames.join(', ')}`)
  console.log()

  // Check group standings for Group A
  const { data: groupAStandings } = await supabaseAdmin
    .from('cup_groups')
    .select('manager_id')
    .eq('cup_id', cup.id)
    .eq('group_name', 'A')

  console.log(`=== Group A ===`)
  console.log(`Managers in group: ${groupAStandings?.length || 0}`)

  for (const entry of groupAStandings || []) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', entry.manager_id)
      .single()

    console.log(`  - ${user?.email}`)
  }
  console.log()

  // Check cup gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('cup_week, stage, league_gameweek_id')
    .eq('cup_id', cup.id)
    .order('cup_week')

  console.log(`=== Cup Gameweeks ===`)
  console.log(`Total: ${cupGameweeks?.length || 0}`)
  cupGameweeks?.slice(0, 5).forEach(cgw => {
    console.log(`  Week ${cgw.cup_week}: Stage=${cgw.stage}, League GW=${cgw.league_gameweek_id}`)
  })
  console.log()

  // Check if there are completed matches
  const { data: matches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, is_completed, home_score, away_score, stage')
    .eq('cup_id', cup.id)
    .limit(10)

  console.log(`=== Cup Matches (first 10) ===`)
  const completedMatches = matches?.filter(m => m.is_completed).length || 0
  console.log(`Total matches: ${matches?.length || 0}`)
  console.log(`Completed: ${completedMatches}`)
  console.log()

  matches?.slice(0, 3).forEach((m, i) => {
    console.log(`  Match ${i + 1}: ${m.home_score ?? '?'}-${m.away_score ?? '?'} (Completed: ${m.is_completed}, Stage: ${m.stage})`)
  })
}

checkCupStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
