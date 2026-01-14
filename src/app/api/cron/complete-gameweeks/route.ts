import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all gameweeks that have passed their end_date but are not yet completed
    const { data: expiredGameweeks, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, week, end_date, is_completed')
      .eq('is_completed', false)
      .lt('end_date', now.toISOString())

    if (fetchError) {
      console.error('[Cron] Error fetching expired gameweeks:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredGameweeks || expiredGameweeks.length === 0) {
      return NextResponse.json({
        message: 'No gameweeks to complete',
        completed: 0
      })
    }


    const completedGameweeks = []
    const errors = []

    // Process each expired gameweek
    for (const gameweek of expiredGameweeks) {
      try {

        // Mark gameweek as completed
        const { error: updateError } = await supabaseAdmin
          .from('gameweeks')
          .update({ is_completed: true })
          .eq('id', gameweek.id)

        if (updateError) {
          console.error(`[Cron] Error completing gameweek ${gameweek.id}:`, updateError)
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
            console.error(`[Cron] Error advancing league ${gameweek.league_id}:`, leagueError)
            errors.push({ gameweekId: gameweek.id, error: `League advancement failed: ${leagueError.message}` })
          } else {
          }
        } else {
        }

        completedGameweeks.push({
          id: gameweek.id,
          week: gameweek.week,
          league_id: gameweek.league_id
        })
      } catch (error) {
        console.error(`[Cron] Unexpected error processing gameweek ${gameweek.id}:`, error)
        errors.push({
          gameweekId: gameweek.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    if (errors.length > 0) {
      console.error(`[Cron] Encountered ${errors.length} errors`)
    }

    return NextResponse.json({
      message: `Completed ${completedGameweeks.length} gameweeks`,
      completed: completedGameweeks.length,
      gameweeks: completedGameweeks,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[Cron] Fatal error in complete-gameweeks cron:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
