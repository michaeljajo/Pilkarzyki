import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable, verifyLeagueAdmin } from '@/lib/auth-helpers'
import { applyDefaultLineupsForGameweek } from '@/lib/apply-default-lineups'

// POST /api/admin/leagues/[id]/apply-default-lineups
// Manual fallback for the nightly żelazko cron. The admin Panel surfaces this
// when a gameweek is locked but a manager still has no lineup (cron failed).
// Applies defaults for a single, already-locked gameweek.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    const adminCheck = await verifyLeagueAdmin(userId, leagueId)
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error || 'Forbidden' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json().catch(() => ({}))
    const gameweekId: string | undefined = body?.gameweekId

    // Resolve the target gameweek: the one requested, else the earliest locked,
    // not-yet-completed gameweek in this league.
    const now = new Date().toISOString()
    let query = supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, week, lock_date, is_completed')
      .eq('league_id', leagueId)
      .eq('is_completed', false)
      .lt('lock_date', now)
      .order('week', { ascending: true })

    if (gameweekId) {
      query = supabaseAdmin
        .from('gameweeks')
        .select('id, league_id, week, lock_date, is_completed')
        .eq('id', gameweekId)
        .eq('league_id', leagueId)
    }

    const { data: gameweeks, error: gwError } = await query
    if (gwError) {
      return NextResponse.json({ error: gwError.message }, { status: 500 })
    }

    const gameweek = gameweeks?.[0]
    if (!gameweek) {
      return NextResponse.json(
        { error: 'Brak zablokowanej kolejki do zastosowania żelazek.' },
        { status: 400 }
      )
    }

    // Guard: never materialise defaults for a gameweek that has not locked yet.
    if (new Date(gameweek.lock_date) > new Date()) {
      return NextResponse.json(
        { error: 'Kolejka nie jest jeszcze zablokowana.' },
        { status: 400 }
      )
    }

    const result = await applyDefaultLineupsForGameweek({
      id: gameweek.id,
      league_id: gameweek.league_id,
      week: gameweek.week,
    })

    return NextResponse.json({
      message: `Zastosowano ${result.appliedLineups} żelazek (liga) i ${result.appliedCupLineups} żelazek (puchar).`,
      appliedLineups: result.appliedLineups,
      appliedCupLineups: result.appliedCupLineups,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    console.error('Error applying default lineups manually:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
