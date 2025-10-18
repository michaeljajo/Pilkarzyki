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

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name, season')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Get user's database ID from Clerk ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of this league (has a squad)
    const { data: squad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)
      .eq('manager_id', user.id)
      .single()

    if (!squad) {
      return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
    }

    // Get standings from database (cached)
    const { data: standingsData, error: standingsError } = await supabaseAdmin
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

    if (standingsError) {
      console.error('Error fetching standings:', standingsError)
      return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 })
    }

    // If no standings exist, calculate them (with race condition protection)
    if (!standingsData || standingsData.length === 0) {
      console.log('No standings found, calculating...')

      // Check if standings are already being calculated for this league
      const existingCalculation = calculatingStandings.get(leagueId)
      if (existingCalculation) {
        console.log('Standings already being calculated, waiting...')
        try {
          const calculatedStandings = await existingCalculation
          calculatingStandings.delete(leagueId)
          return NextResponse.json({
            league,
            standings: calculatedStandings.map((standing, index) => ({
              position: index + 1,
              managerId: standing.managerId,
              managerName: standing.managerName,
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
    const standings = standingsData.map(standing => ({
      position: standing.position,
      managerId: standing.manager_id,
      managerName: standing.users ? `${standing.users.first_name || ''} ${standing.users.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
      email: standing.users?.email || '',
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goalsFor: standing.goals_for,
      goalsAgainst: standing.goals_against,
      goalDifference: standing.goal_difference,
      points: standing.points
    }))

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

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name, season')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Recalculate standings (with race condition protection)
    const existingCalculation = calculatingStandings.get(leagueId)
    let standings

    if (existingCalculation) {
      console.log('Standings already being calculated, waiting...')
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