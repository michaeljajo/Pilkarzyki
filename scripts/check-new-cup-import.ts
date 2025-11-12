import { supabaseAdmin } from '../src/lib/supabase'

async function checkNewCupImport() {
  const wncLeagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

  // Get the most recent cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name, created_at')
    .eq('league_id', wncLeagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!cup) {
    console.log('No cup found')
    return
  }

  console.log(`\n=== Cup Import Verification ===`)
  console.log(`Cup: ${cup.name}`)
  console.log(`ID: ${cup.id}`)
  console.log(`Created: ${cup.created_at}\n`)

  // Get cup gameweeks
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .eq('cup_id', cup.id)
    .order('cup_week')

  console.log(`Cup Gameweeks: ${cupGameweeks?.length || 0}\n`)

  // Check lineups for each cup week
  for (const cgw of cupGameweeks || []) {
    const { data: lineups } = await supabaseAdmin
      .from('cup_lineups')
      .select('id, manager_id, player_ids')
      .eq('cup_gameweek_id', cgw.id)

    const complete = lineups?.filter(l => l.player_ids?.length === 3).length || 0
    const incomplete = lineups?.filter(l => (l.player_ids?.length || 0) < 3).length || 0

    console.log(`Cup Week ${cgw.cup_week}:`)
    console.log(`  Lineups: ${lineups?.length || 0} (Complete: ${complete}, Incomplete: ${incomplete})`)

    // Check results for this cup week
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('id, player_id, goals')
      .eq('gameweek_id', cgw.league_gameweek_id)

    console.log(`  Results in league gameweek: ${results?.length || 0}`)

    // Check if lineup players have results
    const allPlayerIds = new Set<string>()
    lineups?.forEach(l => l.player_ids?.forEach((id: string) => allPlayerIds.add(id)))

    const { data: lineupPlayerResults } = await supabaseAdmin
      .from('results')
      .select('id, player_id, goals')
      .eq('gameweek_id', cgw.league_gameweek_id)
      .in('player_id', Array.from(allPlayerIds))

    console.log(`  Results for lineup players: ${lineupPlayerResults?.length || 0}/${allPlayerIds.size}`)

    if (incomplete > 0) {
      console.log(`  ⚠️  WARNING: ${incomplete} incomplete lineups found!`)

      // Show which players are missing
      for (const lineup of lineups?.filter(l => (l.player_ids?.length || 0) < 3) || []) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', lineup.manager_id)
          .single()

        console.log(`    - ${user?.email}: ${lineup.player_ids?.length || 0} players`)
      }
    }

    console.log()
  }

  // Overall summary
  const { data: allLineups } = await supabaseAdmin
    .from('cup_lineups')
    .select('player_ids')
    .in('cup_gameweek_id', cupGameweeks?.map(cgw => cgw.id) || [])

  const totalComplete = allLineups?.filter(l => l.player_ids?.length === 3).length || 0
  const totalIncomplete = allLineups?.filter(l => (l.player_ids?.length || 0) < 3).length || 0

  console.log(`=== SUMMARY ===`)
  console.log(`Total lineups: ${allLineups?.length || 0}`)
  console.log(`Complete (3 players): ${totalComplete}`)
  console.log(`Incomplete (< 3 players): ${totalIncomplete}`)

  if (totalIncomplete === 0) {
    console.log(`\n✅ All lineups are complete!`)
  } else {
    console.log(`\n❌ ${totalIncomplete} lineups are incomplete!`)
  }
}

checkNewCupImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
