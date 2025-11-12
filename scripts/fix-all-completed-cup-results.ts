import { supabaseAdmin } from '../src/lib/supabase'

async function fixAllCompletedCupResults() {
  console.log('=== Fixing ALL Completed Cup Match Results ===\n')

  // Get all completed cup matches
  const { data: completedMatches } = await supabaseAdmin
    .from('cup_matches')
    .select(`
      id,
      cup_gameweek_id,
      home_manager_id,
      away_manager_id,
      is_completed,
      cup_gameweeks!inner(
        cup_week,
        league_gameweek_id
      )
    `)
    .eq('is_completed', true)

  if (!completedMatches || completedMatches.length === 0) {
    console.log('No completed cup matches found')
    return
  }

  console.log(`Found ${completedMatches.length} completed cup matches\n`)

  let resultsFixed = 0
  let alreadyCorrect = 0
  let errors = 0

  for (const match of completedMatches) {
    const cupGameweek = Array.isArray(match.cup_gameweeks)
      ? match.cup_gameweeks[0]
      : match.cup_gameweeks

    if (!cupGameweek) {
      console.log(`⚠ Match ${match.id}: No cup gameweek data`)
      continue
    }

    // Get both lineups for this match
    const { data: homeLineup } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('manager_id', match.home_manager_id)
      .eq('cup_gameweek_id', match.cup_gameweek_id)
      .single()

    const { data: awayLineup } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('manager_id', match.away_manager_id)
      .eq('cup_gameweek_id', match.cup_gameweek_id)
      .single()

    // Collect all player IDs from both lineups
    const allPlayerIds: string[] = []
    if (homeLineup?.player_ids) {
      allPlayerIds.push(...homeLineup.player_ids)
    }
    if (awayLineup?.player_ids) {
      allPlayerIds.push(...awayLineup.player_ids)
    }

    if (allPlayerIds.length === 0) {
      continue
    }

    // Get all results for these players in the league gameweek
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('id, player_id, has_played')
      .eq('gameweek_id', cupGameweek.league_gameweek_id)
      .in('player_id', allPlayerIds)

    if (!results) continue

    // Update has_played for any results that have it set to false
    for (const result of results) {
      if (!result.has_played) {
        const { error } = await supabaseAdmin
          .from('results')
          .update({ has_played: true })
          .eq('id', result.id)

        if (error) {
          console.log(`❌ Failed to update result ${result.id}: ${error.message}`)
          errors++
        } else {
          // Get player name for better logging
          const { data: player } = await supabaseAdmin
            .from('players')
            .select('name, surname')
            .eq('id', result.player_id)
            .single()

          const playerName = player ? `${player.name} ${player.surname}` : result.player_id
          console.log(`✓ Fixed: ${playerName} in CW${cupGameweek.cup_week}`)
          resultsFixed++
        }
      } else {
        alreadyCorrect++
      }
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Results fixed: ${resultsFixed}`)
  console.log(`Results already correct: ${alreadyCorrect}`)
  console.log(`Errors: ${errors}`)
  console.log('\n=== Done ===')
}

fixAllCompletedCupResults().catch(console.error)
