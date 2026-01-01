import { supabaseAdmin } from '../src/lib/supabase'

async function manuallyCompleteGameweeks() {
  const now = new Date()
  console.log(`Manually completing gameweeks at ${now.toISOString()}`)

  // Find all gameweeks that have passed their end_date but are not yet completed
  const { data: expiredGameweeks, error: fetchError } = await supabaseAdmin
    .from('gameweeks')
    .select('id, league_id, week, end_date, is_completed')
    .eq('is_completed', false)
    .lt('end_date', now.toISOString())
    .order('league_id')
    .order('week')

  if (fetchError) {
    console.error('Error fetching expired gameweeks:', fetchError)
    return
  }

  if (!expiredGameweeks || expiredGameweeks.length === 0) {
    console.log('No gameweeks to complete')
    return
  }

  console.log(`\nFound ${expiredGameweeks.length} gameweeks to complete:\n`)
  expiredGameweeks.forEach((gw) => {
    console.log(`  League ${gw.league_id.substring(0, 8)}..., Week ${gw.week}, Ended: ${gw.end_date}`)
  })

  console.log('\nCompleting gameweeks...\n')

  const completedGameweeks = []
  const errors = []

  // Process each expired gameweek
  for (const gameweek of expiredGameweeks) {
    try {
      console.log(`Completing gameweek ${gameweek.week} for league ${gameweek.league_id.substring(0, 8)}...`)

      // Mark gameweek as completed
      const { error: updateError } = await supabaseAdmin
        .from('gameweeks')
        .update({ is_completed: true })
        .eq('id', gameweek.id)

      if (updateError) {
        console.error(`  ❌ Error completing gameweek: ${updateError.message}`)
        errors.push({ gameweekId: gameweek.id, error: updateError.message })
        continue
      }

      // After completing a gameweek, check if we need to advance the league
      // Find the first incomplete gameweek to set as current
      const { data: nextIncompleteGameweek } = await supabaseAdmin
        .from('gameweeks')
        .select('week')
        .eq('league_id', gameweek.league_id)
        .eq('is_completed', false)
        .order('week', { ascending: true })
        .limit(1)
        .single()

      if (nextIncompleteGameweek) {
        // Update league to point to the next incomplete gameweek
        const { error: leagueError } = await supabaseAdmin
          .from('leagues')
          .update({ current_gameweek: nextIncompleteGameweek.week })
          .eq('id', gameweek.league_id)

        if (leagueError) {
          console.error(`  ❌ Error advancing league: ${leagueError.message}`)
          errors.push({ gameweekId: gameweek.id, error: `League advancement failed: ${leagueError.message}` })
        } else {
          console.log(`  ✅ Completed and advanced league to gameweek ${nextIncompleteGameweek.week}`)
        }
      } else {
        console.log(`  ✅ Completed (no more incomplete gameweeks, season may be complete)`)
      }

      completedGameweeks.push({
        id: gameweek.id,
        week: gameweek.week,
        league_id: gameweek.league_id
      })
    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errors.push({
        gameweekId: gameweek.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Completed: ${completedGameweeks.length} gameweeks`)
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`)
    console.log('\nErrors:')
    errors.forEach(e => console.log(`  - Gameweek ${e.gameweekId}: ${e.error}`))
  }
}

manuallyCompleteGameweeks()
