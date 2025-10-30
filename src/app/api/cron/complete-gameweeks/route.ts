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
    console.log(`[Cron] Checking for gameweeks to complete at ${now.toISOString()}`)

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
      console.log('[Cron] No gameweeks to complete')
      return NextResponse.json({
        message: 'No gameweeks to complete',
        completed: 0
      })
    }

    console.log(`[Cron] Found ${expiredGameweeks.length} gameweeks to complete`)

    const completedGameweeks = []
    const errors = []

    // Process each expired gameweek
    for (const gameweek of expiredGameweeks) {
      try {
        console.log(`[Cron] Completing gameweek ${gameweek.week} (ID: ${gameweek.id})`)

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

        // Get current league data
        const { data: league } = await supabaseAdmin
          .from('leagues')
          .select('current_gameweek')
          .eq('id', gameweek.league_id)
          .single()

        // Only advance if this gameweek matches the league's current gameweek
        if (league && league.current_gameweek === gameweek.week) {
          const nextGameweek = gameweek.week + 1

          // Check if the next gameweek exists
          const { data: nextGameweekExists } = await supabaseAdmin
            .from('gameweeks')
            .select('id')
            .eq('league_id', gameweek.league_id)
            .eq('week', nextGameweek)
            .single()

          if (nextGameweekExists) {
            // Advance the league to the next gameweek
            const { error: leagueError } = await supabaseAdmin
              .from('leagues')
              .update({ current_gameweek: nextGameweek })
              .eq('id', gameweek.league_id)

            if (leagueError) {
              console.error(`[Cron] Error advancing league ${gameweek.league_id}:`, leagueError)
              errors.push({ gameweekId: gameweek.id, error: `League advancement failed: ${leagueError.message}` })
            } else {
              console.log(`[Cron] League ${gameweek.league_id} advanced to gameweek ${nextGameweek}`)
            }
          } else {
            console.log(`[Cron] No next gameweek (${nextGameweek}) found for league ${gameweek.league_id}, season may be complete`)
          }
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

    console.log(`[Cron] Completed ${completedGameweeks.length} gameweeks`)
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
