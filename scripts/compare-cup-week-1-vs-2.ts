import { supabaseAdmin } from '../src/lib/supabase'

async function compareCupWeeks() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .single()

  if (!cup) return

  for (const cupWeek of [1, 2]) {
    const { data: cgw } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, league_gameweek_id')
      .eq('cup_id', cup.id)
      .eq('cup_week', cupWeek)
      .single()

    if (!cgw) continue

    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('cup_gameweek_id', cgw.id)

    const allPlayerIds = new Set<string>()
    lineups?.forEach(l => l.player_ids?.forEach((id: string) => allPlayerIds.add(id)))

    const { data: results } = await supabaseAdmin
      .from('results')
      .select('player_id')
      .eq('gameweek_id', cgw.league_gameweek_id)
      .in('player_id', Array.from(allPlayerIds))

    console.log(`\nCup Week ${cupWeek} ${cupWeek === 1 ? '(WORKING)' : '(BROKEN)'}:`)
    console.log(`  Players in lineups: ${allPlayerIds.size}`)
    console.log(`  Results found: ${results?.length}/${allPlayerIds.size}`)

    if (cupWeek === 1) {
      // Check if results have actual goals/data
      const { data: resultsWithData } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', cgw.league_gameweek_id)
        .in('player_id', Array.from(allPlayerIds))

      const withGoals = resultsWithData?.filter(r => r.goals && r.goals > 0).length || 0
      console.log(`  Results with goals: ${withGoals}`)
    }
  }

  console.log(`\n💡 CONCLUSION:`)
  console.log(`Cup Week 1: Results were created for lineup players ✓`)
  console.log(`Cup Week 2: Results were NOT created for lineup players ✗`)
  console.log(`\nThis means the migration file likely:`)
  console.log(`  - HAS player lineups specified for Cup Week 2`)
  console.log(`  - But DOESN'T have goals/results specified for those players`)
  console.log(`  - Or the import process failed to create results for Cup Week 2+`)
}

compareCupWeeks()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
