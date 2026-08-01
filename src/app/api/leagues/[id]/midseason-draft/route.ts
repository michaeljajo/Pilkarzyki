import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveDraftAccess } from '@/lib/draft-helpers'

/**
 * Consolidated snapshot for the mid-season draft screen. Returns the latest
 * mid-season draft for the league (or null), the managers, every league player
 * with its current owner (so the client can render squads during the drop phase
 * and the free-agent pool during live picking), the staged drops, confirmed
 * picks, remaining quotas, and whose turn it is.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: leagueId } = await params
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await resolveDraftAccess(userId, leagueId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name, is_active')
      .eq('id', leagueId)
      .single()
    if (!league) return NextResponse.json({ error: 'Nie znaleziono ligi.' }, { status: 404 })

    // The latest mid-season draft (active one, or the most recent finished).
    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('*')
      .eq('league_id', leagueId)
      .eq('kind', 'midseason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: squadRows } = await supabaseAdmin
      .from('squads')
      .select('id, manager_id, team_name, users!squads_manager_id_fkey(id, first_name, last_name, email)')
      .eq('league_id', leagueId)

     
    const managers = (squadRows || []).map((s: any) => ({
      squadId: s.id,
      managerId: s.manager_id,
      teamName: s.team_name || null,
      firstName: s.users?.first_name || '',
      lastName: s.users?.last_name || '',
      email: s.users?.email || '',
    }))

    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, club, football_league, position, manager_id')
      .eq('league', league.name)
      .order('surname', { ascending: true })

    const drops = draft
      ? (await supabaseAdmin
          .from('draft_drops')
          .select('id, squad_id, manager_id, player_id')
          .eq('draft_id', draft.id)).data || []
      : []

    const picks = draft
      ? (await supabaseAdmin
          .from('draft_picks')
          .select('id, squad_id, manager_id, player_id, round, pick_number')
          .eq('draft_id', draft.id)
          .order('pick_number', { ascending: true })).data || []
      : []

    const queue: string[] = Array.isArray(draft?.current_queue) ? draft!.current_queue : []
    const onTheClockSquadId = queue.length > 0 ? queue[0] : null
    const onTheClockManager = managers.find((m) => m.squadId === onTheClockSquadId) || null
    const myTurn =
      !!access.squadId && onTheClockSquadId === access.squadId && draft?.status === 'live'

    return NextResponse.json({
      draft,
      league: { id: league.id, name: league.name, isActive: league.is_active !== false },
      managers,
      players: players || [],
      drops,
      picks,
      onTheClockSquadId,
      onTheClockManagerId: onTheClockManager?.managerId || null,
      access: {
        isAdmin: access.isAdmin,
        isManager: access.isManager,
        mySquadId: access.squadId,
        myTurn,
      },
    })
  } catch (error) {
    console.error('GET midseason-draft snapshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
