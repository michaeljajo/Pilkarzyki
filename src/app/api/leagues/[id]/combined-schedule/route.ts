import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ScheduleMatch {
  id: string
  type: 'league' | 'cup'
  gameweekNumber: number
  startDate: string
  endDate: string
  lockDate: string
  isCompleted: boolean
  homeManager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
    squad?: { team_name?: string }
  } | null
  awayManager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
    squad?: { team_name?: string }
  } | null
  homeTeamSource?: string
  awayTeamSource?: string
  homeScore?: number
  awayScore?: number
  stage?: string
  leg?: number
  groupName?: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params
    const { searchParams } = new URL(request.url)
    const managerId = searchParams.get('managerId')

    // Fetch league gameweeks with matches
    const { data: gameweeks, error: gameweeksError } = await supabaseAdmin
      .from('gameweeks')
      .select(`
        id,
        week,
        start_date,
        end_date,
        lock_date,
        is_completed,
        matches (
          id,
          home_manager_id,
          away_manager_id,
          home_score,
          away_score,
          is_completed
        )
      `)
      .eq('league_id', leagueId)
      .order('start_date', { ascending: true })

    if (gameweeksError) {
      return NextResponse.json({ error: gameweeksError.message }, { status: 500 })
    }

    // Check if league has a cup
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, name')
      .eq('league_id', leagueId)
      .single()

    let cupGameweeks: any[] = []
    if (cup) {
      // Fetch cup gameweeks with matches
      const { data: cupGws, error: cupError } = await supabaseAdmin
        .from('cup_gameweeks')
        .select(`
          id,
          cup_week,
          stage,
          leg,
          gameweeks (
            id,
            week,
            start_date,
            end_date,
            lock_date,
            is_completed
          ),
          cup_matches (
            id,
            home_manager_id,
            away_manager_id,
            home_team_source,
            away_team_source,
            home_score,
            away_score,
            home_aggregate_score,
            away_aggregate_score,
            is_completed,
            stage,
            leg,
            group_name
          )
        `)
        .eq('cup_id', cup.id)
        .order('cup_week', { ascending: true })

      if (!cupError && cupGws) {
        cupGameweeks = cupGws
      }
    }

    // Collect all unique manager IDs
    const managerIds = new Set<string>()

    gameweeks?.forEach(gw => {
      gw.matches?.forEach((match: any) => {
        if (match.home_manager_id) managerIds.add(match.home_manager_id)
        if (match.away_manager_id) managerIds.add(match.away_manager_id)
      })
    })

    cupGameweeks?.forEach(gw => {
      gw.cup_matches?.forEach((match: any) => {
        if (match.home_manager_id) managerIds.add(match.home_manager_id)
        if (match.away_manager_id) managerIds.add(match.away_manager_id)
      })
    })

    // Fetch all managers and their squad data
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(managerIds))

    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', Array.from(managerIds))

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    const userMap: Record<string, any> = {}
    users?.forEach(user => {
      userMap[user.id] = {
        ...user,
        squad: squadMap.get(user.id)
      }
    })

    // Transform league matches
    const leagueMatches: ScheduleMatch[] = []
    gameweeks?.forEach(gw => {
      gw.matches?.forEach((match: any) => {
        // Filter by manager if specified
        if (managerId && match.home_manager_id !== managerId && match.away_manager_id !== managerId) {
          return
        }

        leagueMatches.push({
          id: match.id,
          type: 'league',
          gameweekNumber: gw.week,
          startDate: gw.start_date,
          endDate: gw.end_date,
          lockDate: gw.lock_date,
          isCompleted: match.is_completed,
          homeManager: match.home_manager_id ? userMap[match.home_manager_id] : null,
          awayManager: match.away_manager_id ? userMap[match.away_manager_id] : null,
          homeScore: match.home_score,
          awayScore: match.away_score
        })
      })
    })

    // Transform cup matches
    const cupMatches: ScheduleMatch[] = []
    cupGameweeks?.forEach(gw => {
      gw.cup_matches?.forEach((match: any) => {
        // Filter by manager if specified (skip placeholders)
        if (managerId && match.home_manager_id !== managerId && match.away_manager_id !== managerId) {
          return
        }

        cupMatches.push({
          id: match.id,
          type: 'cup',
          gameweekNumber: gw.gameweeks.week,
          startDate: gw.gameweeks.start_date,
          endDate: gw.gameweeks.end_date,
          lockDate: gw.gameweeks.lock_date,
          isCompleted: match.is_completed,
          homeManager: match.home_manager_id ? userMap[match.home_manager_id] : null,
          awayManager: match.away_manager_id ? userMap[match.away_manager_id] : null,
          homeTeamSource: match.home_team_source,
          awayTeamSource: match.away_team_source,
          homeScore: match.home_score,
          awayScore: match.away_score,
          stage: match.stage,
          leg: match.leg,
          groupName: match.group_name
        })
      })
    })

    // Combine and sort by date
    const allMatches = [...leagueMatches, ...cupMatches].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })

    return NextResponse.json({
      matches: allMatches,
      managers: Array.from(managerIds).map(id => userMap[id]).filter(Boolean)
    })
  } catch (error) {
    console.error('Error fetching combined schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
