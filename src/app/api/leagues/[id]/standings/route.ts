import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateLeagueStandings, recalculateLeagueStandings, ManagerStats } from '@/utils/standings-calculator'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

// Simple in-memory cache to prevent concurrent calculations
const calculatingStandings = new Map<string, Promise<ManagerStats[]>>()

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

    // Parallel queries: Get league and user data simultaneously
    const [leagueResult, userResult] = await Promise.all([
      supabaseAdmin
        .from('leagues')
        .select('id, name, season')
        .eq('id', leagueId)
        .single(),
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single()
    ])

    const { data: league, error: leagueError } = leagueResult
    const { data: user } = userResult

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parallel queries: Get squad verification and standings simultaneously
    const [squadResult, standingsResult] = await Promise.all([
      supabaseAdmin
        .from('squads')
        .select('id')
        .eq('league_id', leagueId)
        .eq('manager_id', user.id)
        .single(),
      supabaseAdmin
        .from('standings')
        .select(`
          *,
          users!standings_manager_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('league_id', leagueId)
        .order('position', { ascending: true })
    ])

    const { data: squad } = squadResult
    const { data: standingsData, error: standingsError } = standingsResult

    if (!squad) {
      return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
    }

    if (standingsError) {
      console.error('Error fetching standings:', standingsError)
      return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
    }

    // Fetch squad team names for this league
    const managerIds = standingsData?.map(s => s.manager_id) || []
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)
      .in('manager_id', managerIds)

    const squadMap = new Map(squads?.map(s => [s.manager_id, s]) || [])

    // If no standings exist, calculate them (with race condition protection)
    if (!standingsData || standingsData.length === 0) {

      // Check if standings are already being calculated for this league
      const existingCalculation = calculatingStandings.get(leagueId)
      if (existingCalculation) {
        try {
          const calculatedStandings = await existingCalculation
          calculatingStandings.delete(leagueId)
          return NextResponse.json({
            league,
            standings: calculatedStandings.map((standing, index) => ({
              position: index + 1,
              managerId: standing.managerId,
              managerName: standing.managerName,
              teamName: standing.teamName || null,
              email: standing.email,
              played: standing.played,
              won: standing.won,
              drawn: standing.drawn,
              lost: standing.lost,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              goalDifference: standing.goalDifference,
              points: standing.points
            }))
          })

        } catch (error) {
          calculatingStandings.delete(leagueId)
          throw error
        }
      }

      // Start new calculation and store promise
      const calculationPromise = recalculateLeagueStandings(leagueId)
      calculatingStandings.set(leagueId, calculationPromise)

      try {
        const calculatedStandings = await calculationPromise
        calculatingStandings.delete(leagueId)

        return NextResponse.json({
          league,
          standings: calculatedStandings.map((standing, index) => ({
            position: index + 1,
            managerId: standing.managerId,
            managerName: standing.managerName,
            teamName: standing.teamName || null,
            email: standing.email,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            points: standing.points
          }))
        })
      } catch (error) {
        calculatingStandings.delete(leagueId)
        throw error
      }
    }

    // Transform database standings to response format
    const standings = standingsData.map(standing => {
      const squad = squadMap.get(standing.manager_id)
      return {
        position: standing.position,
        managerId: standing.manager_id,
        managerName: standing.users ? `${standing.users.first_name || ''} ${standing.users.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        teamName: squad?.team_name || null,
        email: standing.users?.email || '',
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goals_for,
        goalsAgainst: standing.goals_against,
        goalDifference: standing.goal_difference,
        points: standing.points
      }
    })

    return NextResponse.json({
      league,
      standings
    })
  } catch (error) {
    console.error('Error in standings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Parallel queries: Verify admin access and get league simultaneously
    const [adminCheck, leagueResult] = await Promise.all([
      verifyLeagueAdmin(userId, leagueId),
      supabaseAdmin
        .from('leagues')
        .select('id, name, season')
        .eq('id', leagueId)
        .single()
    ])

    const { isAdmin, error: authError } = adminCheck
    const { data: league, error: leagueError } = leagueResult

    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Recalculate standings (with race condition protection)
    const existingCalculation = calculatingStandings.get(leagueId)
    let standings

    if (existingCalculation) {
      try {
        standings = await existingCalculation
        calculatingStandings.delete(leagueId)
      } catch (error) {
        calculatingStandings.delete(leagueId)
        throw error
      }
    } else {
      // Start new calculation
      const calculationPromise = recalculateLeagueStandings(leagueId)
      calculatingStandings.set(leagueId, calculationPromise)

      try {
        standings = await calculationPromise
        calculatingStandings.delete(leagueId)
      } catch (error) {
        calculatingStandings.delete(leagueId)
        throw error
      }
    }

    return NextResponse.json({
      message: 'Standings recalculated successfully',
      league,
      standings: standings.map((standing, index) => ({
        position: index + 1,
        managerId: standing.managerId,
        managerName: standing.managerName,
        teamName: standing.teamName || null,
        email: standing.email,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points
      }))
    })
  } catch (error) {
    console.error('Error recalculating standings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}