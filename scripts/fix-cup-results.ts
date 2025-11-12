import { supabaseAdmin } from '../src/lib/supabase'

async function fixCupResults() {
  console.log('=== Diagnosing Cup Results Issue ===\n')

  // 1. Check if results exist with cup_gameweek_id
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .order('cup_week')

  console.log(`Found ${cupGameweeks?.length || 0} cup gameweeks`)

  if (!cupGameweeks || cupGameweeks.length === 0) {
    console.log('No cup gameweeks found!')
    return
  }

  // 2. Check for results with cup gameweek IDs
  const cupGameweekIds = cupGameweeks.map(cg => cg.id)
  const { data: wrongResults, count: wrongCount } = await supabaseAdmin
    .from('results')
    .select('id, gameweek_id, player_id, goals', { count: 'exact' })
    .in('gameweek_id', cupGameweekIds)

  console.log(`\nFound ${wrongCount || 0} results with cup gameweek IDs (WRONG)\n`)

  if (wrongResults && wrongResults.length > 0) {
    console.log('Sample wrong results:')
    wrongResults.slice(0, 5).forEach(r => {
      console.log(`  Result ${r.id}: gameweek_id=${r.gameweek_id}, goals=${r.goals}`)
    })

    console.log('\n=== Fixing Results ===\n')

    // Create a map of cup gameweek ID -> league gameweek ID
    const gameweekMap = new Map<string, string>()
    cupGameweeks.forEach(cg => {
      gameweekMap.set(cg.id, cg.league_gameweek_id)
    })

    // Update each result to use league gameweek ID
    let fixed = 0
    let errors = 0

    for (const result of wrongResults) {
      const leagueGameweekId = gameweekMap.get(result.gameweek_id)

      if (!leagueGameweekId) {
        console.log(`  ❌ Result ${result.id}: No league gameweek found for cup gameweek ${result.gameweek_id}`)
        errors++
        continue
      }

      // Check if a result already exists for this player + league gameweek
      const { data: existing } = await supabaseAdmin
        .from('results')
        .select('id, goals')
        .eq('gameweek_id', leagueGameweekId)
        .eq('player_id', result.player_id)
        .single()

      if (existing) {
        // Result already exists - just delete this duplicate
        const { error: deleteError } = await supabaseAdmin
          .from('results')
          .delete()
          .eq('id', result.id)

        if (deleteError) {
          console.log(`  ❌ Result ${result.id}: Failed to delete duplicate - ${deleteError.message}`)
          errors++
        } else {
          console.log(`  ✓ Result ${result.id}: Deleted duplicate (already exists as ${existing.id})`)
          fixed++
        }
      } else {
        // Update to use league gameweek ID
        const { error: updateError } = await supabaseAdmin
          .from('results')
          .update({ gameweek_id: leagueGameweekId })
          .eq('id', result.id)

        if (updateError) {
          console.log(`  ❌ Result ${result.id}: Failed to update - ${updateError.message}`)
          errors++
        } else {
          console.log(`  ✓ Result ${result.id}: Updated gameweek_id from ${result.gameweek_id} to ${leagueGameweekId}`)
          fixed++
        }
      }
    }

    console.log(`\n=== Summary ===`)
    console.log(`Fixed: ${fixed}`)
    console.log(`Errors: ${errors}`)

    // 3. Now recalculate all cup match scores
    console.log('\n=== Recalculating Cup Match Scores ===\n')

    const { data: cupMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('id, cup_gameweek_id, home_manager_id, away_manager_id')

    let recalculated = 0

    for (const match of cupMatches || []) {
      // Get league gameweek ID
      const { data: cupGameweek } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('league_gameweek_id')
        .eq('id', match.cup_gameweek_id)
        .single()

      if (!cupGameweek) continue

      // Get home lineup
      const { data: homeLineup } = await supabaseAdmin
        .from('cup_lineups')
        .select('player_ids')
        .eq('manager_id', match.home_manager_id)
        .eq('cup_gameweek_id', match.cup_gameweek_id)
        .single()

      // Get away lineup
      const { data: awayLineup } = await supabaseAdmin
        .from('cup_lineups')
        .select('player_ids')
        .eq('manager_id', match.away_manager_id)
        .eq('cup_gameweek_id', match.cup_gameweek_id)
        .single()

      let homeScore = 0
      let awayScore = 0

      // Calculate home score
      if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
        const { data: homeResults } = await supabaseAdmin
          .from('results')
          .select('goals')
          .eq('gameweek_id', cupGameweek.league_gameweek_id)
          .in('player_id', homeLineup.player_ids)

        homeScore = homeResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
      }

      // Calculate away score
      if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
        const { data: awayResults } = await supabaseAdmin
          .from('results')
          .select('goals')
          .eq('gameweek_id', cupGameweek.league_gameweek_id)
          .in('player_id', awayLineup.player_ids)

        awayScore = awayResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
      }

      // Update match scores
      const { error: updateError } = await supabaseAdmin
        .from('cup_matches')
        .update({ home_score: homeScore, away_score: awayScore })
        .eq('id', match.id)

      if (updateError) {
        console.log(`  ❌ Match ${match.id}: Failed to update scores - ${updateError.message}`)
      } else {
        console.log(`  ✓ Match ${match.id}: Updated scores to ${homeScore}-${awayScore}`)
        recalculated++
      }
    }

    console.log(`\n=== Recalculation Summary ===`)
    console.log(`Matches recalculated: ${recalculated}`)
  } else {
    console.log('No wrong results found - results are already using league gameweek IDs')
  }

  console.log('\n=== Done ===')
}

fixCupResults().catch(console.error)
