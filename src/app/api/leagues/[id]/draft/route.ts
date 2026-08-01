import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveDraftAccess } from '@/lib/draft-helpers'
import { fetchAllPlayersInLeague } from '@/lib/players'

// Consolidated draft snapshot. Called on load and re-fetched by clients on any
// realtime event, so it is the single source of truth for the draft screen and
// the reconnect story.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: leagueId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await resolveDraftAccess(userId, leagueId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // League (for name -> player pool, and size).
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name, max_managers, is_active')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'Nie znaleziono ligi.' }, { status: 404 })
    }

    // Ensure a draft row exists (one per league). Lazily created so the screen
    // always has a draft in 'setup' to configure — but NEVER for an archived
    // league (archived seasons are strictly read-only).
    let { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('*')
      .eq('league_id', leagueId)
      .eq('kind', 'preseason')
      .maybeSingle()

    if (!draft && league.is_active !== false) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('drafts')
        .insert({ league_id: leagueId, kind: 'preseason' })
        .select('*')
        .single()
      if (createError) {
        // A concurrent request may have created it (unique league_id) — refetch.
        const { data: refetched } = await supabaseAdmin
          .from('drafts')
          .select('*')
          .eq('league_id', leagueId)
          .maybeSingle()
        draft = refetched
      } else {
        draft = created
      }
    }

    // Managers = squads in the league, with user + team name.
    const { data: squadRows } = await supabaseAdmin
      .from('squads')
      .select('id, manager_id, team_name, users!squads_manager_id_fkey(id, first_name, last_name, email)')
      .eq('league_id', leagueId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managers = (squadRows || []).map((s: any) => ({
      squadId: s.id,
      managerId: s.manager_id,
      teamName: s.team_name || null,
      firstName: s.users?.first_name || '',
      lastName: s.users?.last_name || '',
      email: s.users?.email || '',
    }))

    // Player pool for the league. Paged — the pool is larger than PostgREST's
    // 1000-row response cap, which would otherwise truncate the draft board.
    const players = await fetchAllPlayersInLeague(
      league.name,
      'id, name, surname, club, football_league, position'
    )

    // All confirmed picks for this draft.
    const picks = draft
      ? (await supabaseAdmin
          .from('draft_picks')
          .select('id, squad_id, manager_id, player_id, round, pick_number')
          .eq('draft_id', draft.id)
          .order('pick_number', { ascending: true })).data || []
      : []

    // Active stand-ins: who may pick for whom while a manager is away.
    const delegationRows = draft
      ? (await supabaseAdmin
          .from('draft_delegations')
          .select('delegator_squad_id, delegate_user_id')
          .eq('draft_id', draft.id)).data || []
      : []
    const delegations = delegationRows.map((d) => ({
      delegatorSquadId: d.delegator_squad_id,
      delegateUserId: d.delegate_user_id,
    }))

    // Derive on-the-clock squad and whether it is the caller's turn.
    const queue: string[] = Array.isArray(draft?.current_queue) ? draft!.current_queue : []
    const onTheClockSquadId = queue.length > 0 ? queue[0] : null
    const onTheClockManager = managers.find(m => m.squadId === onTheClockSquadId) || null
    const myTurn =
      !!access.squadId && onTheClockSquadId === access.squadId && draft?.status === 'live'

    return NextResponse.json({
      draft,
      league: { id: league.id, name: league.name, maxManagers: league.max_managers },
      managers,
      players,
      picks,
      delegations,
      onTheClockSquadId,
      onTheClockManagerId: onTheClockManager?.managerId || null,
      access: {
        isAdmin: access.isAdmin,
        isManager: access.isManager,
        mySquadId: access.squadId,
        myUserId: access.userInternalId || null,
        myTurn,
      },
    })
  } catch (error) {
    console.error('GET draft snapshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
