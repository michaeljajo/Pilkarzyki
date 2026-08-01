import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { canViewLeague } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const leagueId = resolvedParams.id

    // Get user record
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get league details
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name, admin_id')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // League admins, its managers, or anyone when the league is a public
    // showcase. canViewLeague is league-scoped (league_admins), replacing the
    // old global users.is_admin check that granted every super-admin read
    // access to every league.
    const { canView } = await canViewLeague(userId, leagueId)
    if (!canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all squads for this league with manager information
    const { data: squads, error: squadsError } = await supabaseAdmin
      .from('squads')
      .select(`
        id,
        manager_id,
        league_id,
        team_name,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('league_id', leagueId)
      .order('team_name', { ascending: true, nullsFirst: false })

    if (squadsError) {
      console.error('Error fetching squads:', squadsError)
      return NextResponse.json({ error: squadsError.message }, { status: 500 })
    }

    // Check if league has a cup
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, name')
      .eq('league_id', leagueId)
      .single()

    // Draft pick order for the whole league, fetched once. Rosters are presented
    // in the sequence players were drafted in, which is how managers remember
    // their squad — not alphabetically. pick_number restarts per draft, so the
    // sort key is (draft index by created_at, pick_number): pre-season picks
    // first, then any mid-season draft's picks after them.
    const { data: leagueDrafts } = await supabaseAdmin
      .from('drafts')
      .select('id, created_at')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: true })

    const draftOrder = new Map<string, number>()
    ;(leagueDrafts || []).forEach((d, i) => draftOrder.set(d.id, i))

    const pickOrderByPlayer = new Map<string, number>()
    if (draftOrder.size > 0) {
      const { data: allPicks } = await supabaseAdmin
        .from('draft_picks')
        .select('player_id, pick_number, draft_id')
        .in('draft_id', [...draftOrder.keys()])

      ;(allPicks || []).forEach((p) => {
        const draftIndex = draftOrder.get(p.draft_id) ?? 0
        // Players can only be picked once, so first write wins.
        if (!pickOrderByPlayer.has(p.player_id)) {
          pickOrderByPlayer.set(p.player_id, draftIndex * 1_000_000 + (p.pick_number ?? 0))
        }
      })
    }

    // Undrafted players (manual assignment, transfers, imports) have no pick
    // number; they sort after every drafted player, alphabetically among themselves.
    const byDraftSequence = (a: { id: string; surname?: string }, b: { id: string; surname?: string }) => {
      const ao = pickOrderByPlayer.get(a.id)
      const bo = pickOrderByPlayer.get(b.id)
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      return (a.surname || '').localeCompare(b.surname || '', 'pl')
    }

    // For each squad, fetch players and default lineups
    const squadDetails = await Promise.all(
      (squads || []).map(async (squad) => {
        // Get players for this manager
        const { data: players } = await supabaseAdmin
          .from('players')
          // football_league drives the flag shown next to each player, matching
          // how the draft board renders a roster.
          .select('id, name, surname, position, club, football_league')
          .eq('manager_id', squad.manager_id)
          .eq('league', league.name)

        const orderedPlayers = [...(players || [])].sort(byDraftSequence)

        // Get default league lineup
        const { data: defaultLineup } = await supabaseAdmin
          .from('default_lineups')
          .select('id, player_ids')
          .eq('manager_id', squad.manager_id)
          .eq('league_id', leagueId)
          .single()

        // Get default cup lineup if cup exists
        let defaultCupLineup = null
        if (cup) {
          const { data: cupLineup } = await supabaseAdmin
            .from('default_cup_lineups')
            .select('id, player_ids')
            .eq('manager_id', squad.manager_id)
            .eq('cup_id', cup.id)
            .single()

          defaultCupLineup = cupLineup
        }

        // Map player IDs to player details for default lineups
        let defaultLineupPlayers: any[] = []
        if (defaultLineup && defaultLineup.player_ids && players) {
          defaultLineupPlayers = defaultLineup.player_ids
            .map(playerId => players.find(p => p.id === playerId))
            .filter(Boolean)
        }

        let defaultCupLineupPlayers: any[] = []
        if (defaultCupLineup && defaultCupLineup.player_ids && players) {
          defaultCupLineupPlayers = defaultCupLineup.player_ids
            .map(playerId => players.find(p => p.id === playerId))
            .filter(Boolean)
        }

        return {
          squadId: squad.id,
          teamName: squad.team_name,
          manager: squad.users,
          players: orderedPlayers,
          defaultLineup: defaultLineupPlayers,
          defaultCupLineup: defaultCupLineupPlayers,
        }
      })
    )

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name
      },
      hasCup: !!cup,
      cupName: cup?.name,
      squads: squadDetails
    })
  } catch (error) {
    console.error('Error in squads API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
