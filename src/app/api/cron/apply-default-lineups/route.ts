import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { applyDefaultLineupsForGameweek, type ApplyError } from '@/lib/apply-default-lineups'

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

    // Find locked gameweeks, but skip archived seasons — those are frozen.
    const { data: lockedGameweeks, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, week, lock_date, is_completed, leagues!inner(is_active)')
      .eq('is_completed', false)
      .lt('lock_date', now.toISOString())
      .eq('leagues.is_active', true)

    if (fetchError) {
      console.error('[Cron] Error fetching locked gameweeks:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!lockedGameweeks || lockedGameweeks.length === 0) {
      return NextResponse.json({
        message: 'No locked gameweeks to process',
        appliedLineups: 0,
        appliedCupLineups: 0,
      })
    }

    let totalAppliedLineups = 0
    let totalAppliedCupLineups = 0
    const errors: ApplyError[] = []

    for (const gameweek of lockedGameweeks) {
      try {
        const result = await applyDefaultLineupsForGameweek({
          id: gameweek.id,
          league_id: gameweek.league_id,
          week: gameweek.week,
        })
        totalAppliedLineups += result.appliedLineups
        totalAppliedCupLineups += result.appliedCupLineups
        errors.push(...result.errors)
      } catch (error) {
        console.error(`[Cron] Unexpected error processing gameweek ${gameweek.id}:`, error)
        errors.push({
          gameweekId: gameweek.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (errors.length > 0) {
      console.error(`[Cron] Encountered ${errors.length} errors`)
    }

    return NextResponse.json({
      message: `Applied ${totalAppliedLineups} default lineups and ${totalAppliedCupLineups} default cup lineups`,
      appliedLineups: totalAppliedLineups,
      appliedCupLineups: totalAppliedCupLineups,
      processedGameweeks: lockedGameweeks.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] Fatal error in apply-default-lineups cron:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
