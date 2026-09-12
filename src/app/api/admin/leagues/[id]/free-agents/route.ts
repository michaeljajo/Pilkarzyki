import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { fetchAllRows } from '@/lib/fetch-all-rows'

/**
 * GET /api/admin/leagues/[id]/free-agents — every player in the league with no
 * manager, i.e. the pool an admin may pick a replacement from.
 *
 * Deliberately narrower than /api/leagues/[id]/players, which joins the owner
 * of all ~5000 players: here the owner is known to be nobody, so the payload is
 * just what the picker renders.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isAdmin } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień administratora tej ligi.' }, { status: 403 })
    }

    // Paged: PostgREST silently caps a select at 1000 rows and an untouched
    // pool runs to thousands. The `id` tiebreaker keeps the sort total, so no
    // row is duplicated across pages or dropped between them.
    const players = await fetchAllRows((from, to) =>
      supabaseAdmin
        .from('players')
        .select('id, name, surname, position, club, football_league')
        .eq('league_id', leagueId)
        .is('manager_id', null)
        .order('surname', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
    )

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error in GET /api/admin/leagues/[id]/free-agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
