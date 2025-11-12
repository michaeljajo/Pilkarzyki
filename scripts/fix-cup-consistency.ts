import { supabaseAdmin } from '../src/lib/supabase'

async function fixCupConsistency() {
  console.log('=== Fixing Cup Match Scores and Has_Played Consistency ===\n')

  // Get all cup matches
  const { data: cupMatches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, cup_gameweek_id, home_manager_id, away_manager_id, home_score, away_score, is_completed, stage')
    .order('cup_gameweek_id')

  if (!cupMatches) {
    console.log('No cup matches found')
    return
  }

  console.log(`Found ${cupMatches.length} cup matches\n`)

  let updated = 0
  let unchanged = 0
  let hasPlayedUpdated = 0

  for (const match of cupMatches) {
    // Get cup gameweek details
    const { data: cupGameweek } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('cup_week, league_gameweek_id')
      .eq('id', match.cup_gameweek_id)
      .single()

    if (!cupGameweek) {
      console.log(`⚠ Match ${match.id}: Cup gameweek not found`)
      continue
    }

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
    const allPlayerIds: string[] = []

    // Calculate home score
    if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
      allPlayerIds.push(...homeLineup.player_ids)

      const { data: homeResults } = await supabaseAdmin
        .from('results')
        .select('id, player_id, goals, has_played')
        .eq('gameweek_id', cupGameweek.league_gameweek_id)
        .in('player_id', homeLineup.player_ids)

      homeScore = homeResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0

      // Update has_played flag if match is completed
      if (match.is_completed && homeResults) {
        for (const result of homeResults) {
          if (!result.has_played) {
            const { error } = await supabaseAdmin
              .from('results')
              .update({ has_played: true })
              .eq('id', result.id)

            if (!error) {
              hasPlayedUpdated++
            }
          }
        }
      }
    }

    // Calculate away score
    if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
      allPlayerIds.push(...awayLineup.player_ids)

      const { data: awayResults } = await supabaseAdmin
        .from('results')
        .select('id, player_id, goals, has_played')
        .eq('gameweek_id', cupGameweek.league_gameweek_id)
        .in('player_id', awayLineup.player_ids)

      awayScore = awayResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0

      // Update has_played flag if match is completed
      if (match.is_completed && awayResults) {
        for (const result of awayResults) {
          if (!result.has_played) {
            const { error } = await supabaseAdmin
              .from('results')
              .update({ has_played: true })
              .eq('id', result.id)

            if (!error) {
              hasPlayedUpdated++
            }
          }
        }
      }
    }

    // Update match scores if they've changed
    const scoresChanged = match.home_score !== homeScore || match.away_score !== awayScore

    if (scoresChanged) {
      const { error } = await supabaseAdmin
        .from('cup_matches')
        .update({
          home_score: homeScore,
          away_score: awayScore
        })
        .eq('id', match.id)

      if (error) {
        console.log(`❌ Match ${match.id} (CW${cupGameweek.cup_week}): Failed - ${error.message}`)
      } else {
        console.log(`✓ Match ${match.id} (CW${cupGameweek.cup_week}, ${match.stage}): ${match.home_score}-${match.away_score} → ${homeScore}-${awayScore}`)
        updated++
      }
    } else {
      unchanged++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Matches updated: ${updated}`)
  console.log(`Matches unchanged: ${unchanged}`)
  console.log(`Results has_played updated: ${hasPlayedUpdated}`)

  console.log('\n=== Verification: Sample Cup Matches ===\n')

  // Show first 10 completed matches
  const { data: sampleMatches } = await supabaseAdmin
    .from('cup_matches')
    .select(`
      id,
      home_score,
      away_score,
      is_completed,
      stage,
      cup_gameweeks!inner(cup_week)
    `)
    .eq('is_completed', true)
    .order('cup_gameweeks(cup_week)')
    .limit(10)

  sampleMatches?.forEach((match: any) => {
    console.log(`CW${match.cup_gameweeks.cup_week} (${match.stage}): ${match.home_score}-${match.away_score} (completed: ${match.is_completed})`)
  })

  console.log('\n=== Done ===')
}

fixCupConsistency().catch(console.error)
