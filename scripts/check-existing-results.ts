import { supabaseAdmin } from '../src/lib/supabase'

async function checkExistingResults() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  // Get the latest cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) return

  // Get cup gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .eq('cup_id', cup.id)
    .order('cup_week')

  console.log(`\n=== Checking Existing Results ===\n`)

  for (const cgw of cupGameweeks || []) {
    if (!cgw.league_gameweek_id) continue

    // Get all lineups for this cup week
    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('cup_gameweek_id', cgw.id)

    const allPlayerIds = new Set<string>()
    lineups?.forEach(l => l.player_ids?.forEach((id: string) => allPlayerIds.add(id)))

    // Check how many results already exist for these players in this gameweek
    if (allPlayerIds.size === 0) continue

    const { data: existingResults } = await supabaseAdmin
      .from('results')
      .select('id, player_id, goals, has_played')
      .eq('gameweek_id', cgw.league_gameweek_id)
      .in('player_id', Array.from(allPlayerIds))

    console.log(`Cup Week ${cgw.cup_week}:`)
    console.log(`  Lineup players: ${allPlayerIds.size}`)
    console.log(`  Existing results: ${existingResults?.length || 0}`)

    if (existingResults && existingResults.length > 0) {
      const withGoals = existingResults.filter(r => r.goals && r.goals > 0).length
      console.log(`  Results with goals > 0: ${withGoals}`)
    }
    console.log()
  }
}

checkExistingResults()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
