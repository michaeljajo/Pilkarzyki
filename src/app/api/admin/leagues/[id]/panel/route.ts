import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { evaluateDefaultLineup } from '@/lib/default-lineup-validation'
import {
  SQUAD_PLAYER_COLUMNS,
  groupPlayersByManager,
  type PlayerRow,
} from '@/lib/player-mapper'
import { Player } from '@/types'

export const dynamic = 'force-dynamic'

type GameweekState = 'open' | 'locked' | 'completed'

interface ManagerRow {
  id: string
  name: string
}

// GET /api/admin/leagues/[id]/panel
// Single aggregate feed for the admin Panel (read-only dashboard).
export async function GET(
  _request: NextRequest,
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

    // League
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name, is_active, current_gameweek')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'Nie znaleziono ligi.' }, { status: 404 })
    }

    // Current gameweek: earliest not-completed by week; else the last one.
    const { data: gameweeks } = await supabaseAdmin
      .from('gameweeks')
      .select('id, week, lock_date, is_completed')
      .eq('league_id', leagueId)
      .order('week', { ascending: true })

    const allGameweeks = gameweeks || []
    const current =
      allGameweeks.find((g) => !g.is_completed) ??
      allGameweeks[allGameweeks.length - 1] ??
      null

    if (!current) {
      return NextResponse.json({
        league: { id: league.id, name: league.name, isActive: league.is_active },
        gameweek: null,
        lineups: null,
        warnings: { invalidDefaults: [], cronFailure: null },
        cup: null,
      })
    }

    const now = new Date()
    const locked = new Date(current.lock_date) <= now
    const state: GameweekState = current.is_completed
      ? 'completed'
      : locked
        ? 'locked'
        : 'open'

    // Managers (squads + users)
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, users!inner (id, first_name, last_name, email)')
      .eq('league_id', leagueId)

    type SquadWithUser = {
      manager_id: string
      users: { id: string; first_name: string | null; last_name: string | null; email: string }
    }
    const managers: ManagerRow[] = ((squads as unknown as SquadWithUser[]) || []).map((s) => ({
      id: s.users.id,
      name:
        `${s.users.first_name ?? ''} ${s.users.last_name ?? ''}`.trim() || s.users.email,
    }))
    const managerName = new Map(managers.map((m) => [m.id, m.name]))
    const managerIds = managers.map((m) => m.id)

    // Lineups for the current gameweek
    const { data: lineups } = await supabaseAdmin
      .from('lineups')
      .select('manager_id, is_from_default')
      .eq('gameweek_id', current.id)

    const lineupByManager = new Map(
      (lineups || []).map((l) => [l.manager_id as string, !!l.is_from_default])
    )

    const zelazkoNames: string[] = []
    const ownNames: string[] = []
    const missingNames: string[] = []
    for (const m of managers) {
      if (!lineupByManager.has(m.id)) {
        missingNames.push(m.name)
      } else if (lineupByManager.get(m.id)) {
        zelazkoNames.push(m.name)
      } else {
        ownNames.push(m.name)
      }
    }

    // Load squads (players keyed by league NAME) to validate defaults.
    let squadPlayersByManager = new Map<string, Player[]>()
    if (managerIds.length > 0) {
      const { data: leaguePlayers } = await supabaseAdmin
        .from('players')
        .select(SQUAD_PLAYER_COLUMNS)
        .eq('league', league.name)
        .in('manager_id', managerIds)
        .not('manager_id', 'is', null)

      squadPlayersByManager = groupPlayersByManager(
        leaguePlayers as unknown as PlayerRow[] | null
      )
    }

    // Default-lineup validity per manager (only meaningful before completion).
    const invalidDefaults: Array<{ managerName: string; removedPlayerNames: string[] }> = []
    if (!current.is_completed && managerIds.length > 0) {
      const { data: defaults } = await supabaseAdmin
        .from('default_lineups')
        .select('manager_id, player_ids')
        .eq('league_id', leagueId)
        .in('manager_id', managerIds)

      const removedIdSet = new Set<string>()
      const perManagerRemoved = new Map<string, string[]>()
      for (const d of defaults || []) {
        const validity = evaluateDefaultLineup(
          d.player_ids,
          squadPlayersByManager.get(d.manager_id) ?? [],
          { requireExactlyThree: true }
        )
        const hasDefault = !!d.player_ids && d.player_ids.length > 0
        if (hasDefault && !validity.isValid && validity.removedPlayerIds.length > 0) {
          perManagerRemoved.set(d.manager_id, validity.removedPlayerIds)
          validity.removedPlayerIds.forEach((pid) => removedIdSet.add(pid))
        }
      }

      // Resolve removed player names (they may have left the squad entirely).
      const removedNameById = new Map<string, string>()
      if (removedIdSet.size > 0) {
        const { data: removedPlayers } = await supabaseAdmin
          .from('players')
          .select('id, name, surname')
          .in('id', Array.from(removedIdSet))
        for (const p of removedPlayers || []) {
          removedNameById.set(p.id, `${p.name ?? ''} ${p.surname ?? ''}`.trim())
        }
      }

      for (const [mid, removedIds] of perManagerRemoved) {
        invalidDefaults.push({
          managerName: managerName.get(mid) ?? 'Nieznany',
          removedPlayerNames: removedIds.map((pid) => removedNameById.get(pid) || 'zawodnik'),
        })
      }
    }

    // Cron failure: locked, not completed, but some manager has no lineup at all.
    const cronFailure =
      state === 'locked' && missingNames.length > 0 ? { missingNames } : null

    // Cup status for this gameweek
    const STAGE_LABEL_PL: Record<string, string> = {
      group_stage: 'Faza grupowa',
      round_of_16: '1/8 finału',
      quarter_final: 'Ćwierćfinał',
      semi_final: 'Półfinał',
      final: 'Finał',
    }
    let cup: { name: string; round: string } | null = null
    const { data: cupGameweeks } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, cup_id, stage, leg, cups!inner (name)')
      .eq('league_gameweek_id', current.id)
      .limit(1)
    if (cupGameweeks && cupGameweeks.length > 0) {
      const cg = cupGameweeks[0] as unknown as {
        stage: string
        leg: number
        cups: { name: string }
      }
      const roundLabel = STAGE_LABEL_PL[cg.stage] ?? cg.stage
      const legSuffix = cg.leg === 2 ? ' (rewanż)' : ''
      cup = { name: cg.cups?.name ?? 'Puchar', round: `${roundLabel}${legSuffix}` }
    }

    return NextResponse.json({
      league: { id: league.id, name: league.name, isActive: league.is_active },
      gameweek: {
        id: current.id,
        week: current.week,
        lockDate: current.lock_date,
        isCompleted: current.is_completed,
        state,
      },
      lineups: {
        total: managers.length,
        submittedOwn: ownNames.length,
        zelazko: zelazkoNames.length,
        missing: missingNames.length,
        zelazkoNames,
        missingNames,
      },
      warnings: {
        invalidDefaults,
        cronFailure,
      },
      cup,
    })
  } catch (error) {
    console.error('Error building admin panel feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
