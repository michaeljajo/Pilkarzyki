import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveDraftAccess } from '@/lib/draft-helpers'
import { fetchAllRows } from '@/lib/fetch-all-rows'

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

     
    const managers = (squadRows || []).map((s: any) => ({
      squadId: s.id,
      managerId: s.manager_id,
      teamName: s.team_name || null,
      firstName: s.users?.first_name || '',
      lastName: s.users?.last_name || '',
      email: s.users?.email || '',
    }))

    // Present squads in draft order. The squads table has no meaningful order
    // of its own, so without this the roster listed managers however Postgres
    // happened to return them — which bears no relation to who picks next and
    // made the panel unreadable as a running order. Squads missing from
    // pick_order (and every squad before the draft starts, when it is empty)
    // fall to the end, sorted by name so the list is at least stable.
    const pickOrder: string[] = Array.isArray(draft?.pick_order) ? draft!.pick_order : []
    const orderIndex = new Map(pickOrder.map((squadId, i) => [squadId, i]))
    const displayName = (m: (typeof managers)[number]) =>
      m.teamName || [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || m.email || ''
    managers.sort((a, b) => {
      const ai = orderIndex.get(a.squadId) ?? Number.MAX_SAFE_INTEGER
      const bi = orderIndex.get(b.squadId) ?? Number.MAX_SAFE_INTEGER
      if (ai !== bi) return ai - bi
      return displayName(a).localeCompare(displayName(b), 'pl')
    })

    // Player pool for the league. Paged: a full pool is ~5000 and an unpaged
    // select silently stops at 1000, so the board would show a fifth of it.
    // The `id` tiebreaker keeps the sort total, otherwise rows shift between
    // pages and get both duplicated and dropped.
    const players = await fetchAllRows((from, to) =>
      supabaseAdmin
        .from('players')
        .select('id, name, surname, club, football_league, position')
        .eq('league_id', leagueId)
        .order('surname', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
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
      players: players || [],
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
