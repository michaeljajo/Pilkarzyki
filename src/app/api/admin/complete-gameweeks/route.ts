import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const now = new Date()
    console.log(`[Admin] Manually completing gameweeks at ${now.toISOString()}`)

    // Find all gameweeks that have passed their end_date but are not yet completed
    const { data: expiredGameweeks, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, week, end_date, is_completed')
      .eq('is_completed', false)
      .lt('end_date', now.toISOString())

    if (fetchError) {
      console.error('[Admin] Error fetching expired gameweeks:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredGameweeks || expiredGameweeks.length === 0) {
      console.log('[Admin] No gameweeks to complete')
      return NextResponse.json({
        message: 'No gameweeks to complete',
        completed: 0
      })
    }

    console.log(`[Admin] Found ${expiredGameweeks.length} gameweeks to complete`)

    const completedGameweeks = []
    const errors = []

    // Process each expired gameweek
    for (const gameweek of expiredGameweeks) {
      try {
        console.log(`[Admin] Completing gameweek ${gameweek.week} (ID: ${gameweek.id})`)

        // Mark gameweek as completed
        const { error: updateError } = await supabaseAdmin
          .from('gameweeks')
          .update({ is_completed: true })
          .eq('id', gameweek.id)

        if (updateError) {
          console.error(`[Admin] Error completing gameweek ${gameweek.id}:`, updateError)
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
            console.error(`[Admin] Error advancing league ${gameweek.league_id}:`, leagueError)
            errors.push({ gameweekId: gameweek.id, error: `League advancement failed: ${leagueError.message}` })
          } else {
            console.log(`[Admin] League ${gameweek.league_id} advanced to gameweek ${nextIncompleteGameweek.week}`)
          }
        } else {
          console.log(`[Admin] No incomplete gameweeks found for league ${gameweek.league_id}, season may be complete`)
        }

        completedGameweeks.push({
          id: gameweek.id,
          week: gameweek.week,
          league_id: gameweek.league_id
        })
      } catch (error) {
        console.error(`[Admin] Unexpected error processing gameweek ${gameweek.id}:`, error)
        errors.push({
          gameweekId: gameweek.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`[Admin] Completed ${completedGameweeks.length} gameweeks`)
    if (errors.length > 0) {
      console.error(`[Admin] Encountered ${errors.length} errors`)
    }

    return NextResponse.json({
      message: `Completed ${completedGameweeks.length} gameweeks`,
      completed: completedGameweeks.length,
      gameweeks: completedGameweeks,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[Admin] Fatal error in manual complete-gameweeks:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
