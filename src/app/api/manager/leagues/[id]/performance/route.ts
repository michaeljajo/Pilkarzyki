import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await params

    // Get user information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's position in league standings
    const standingsResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/leagues/${leagueId}/standings`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      }
    }).catch(() => null)

    interface StandingData {
      email: string
      position: number
      points: number
      played: number
      won: number
      drawn: number
      lost: number
      goals_for: number
      goals_against: number
      goal_difference: number
    }

    let userStanding: StandingData | null | undefined = null
    if (standingsResponse && standingsResponse.ok) {
      const standingsData = await standingsResponse.json()
      userStanding = standingsData.standings?.find((s: StandingData) => s.email === user.email)
    }

    // Get user's recent matches (last 5)
    const { data: recentMatches } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        gameweek_id,
        home_manager_id,
        away_manager_id,
        home_score,
        away_score,
        is_completed,
        gameweeks:gameweek_id (
          week,
          start_date
        ),
        home_manager:users!matches_home_manager_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        away_manager:users!matches_away_manager_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .or(`home_manager_id.eq.${user.id},away_manager_id.eq.${user.id}`)
      .eq('is_completed', true)
      .order('gameweek_id', { ascending: false })
      .limit(5)

    // Get user's goal scoring history by gameweek
    const { data: goalHistory } = await supabaseAdmin
      .from('results')
      .select(`
        goals,
        gameweek_id,
        gameweeks:gameweek_id (
          week,
          start_date
        ),
        players:player_id (
          id,
          name,
          surname,
          position
        )
      `)
      .in('player_id', [
        // This would need to be enhanced to get user's player IDs
        // For now, we'll leave it empty and handle in the frontend
      ])
      .order('gameweek_id', { ascending: false })

    // Calculate recent form (last 5 matches)
    interface MatchWithRelations {
      id: string
      home_manager_id: string
      away_manager_id: string
      home_score: number | null
      away_score: number | null
      gameweeks: {
        week: number
        start_date: string
      } | null
      home_manager: {
        first_name: string | null
        last_name: string | null
      } | null
      away_manager: {
        first_name: string | null
        last_name: string | null
      } | null
    }

    let recentForm: Array<{
      result: string
      opponent: string
      score: string
      gameweek: number
    }> = []
    if (recentMatches) {
      recentForm = recentMatches.map((match: MatchWithRelations) => {
        const isHome = match.home_manager_id === user.id
        const userScore = isHome ? match.home_score : match.away_score
        const opponentScore = isHome ? match.away_score : match.home_score

        let result = 'D' // Draw
        if (userScore > opponentScore) result = 'W' // Win
        else if (userScore < opponentScore) result = 'L' // Loss

        return {
          gameweek: match.gameweeks?.week,
          result,
          score: `${userScore}-${opponentScore}`,
          opponent: isHome ? match.away_manager : match.home_manager,
          date: match.gameweeks?.start_date
        }
      })
    }

    // Get user's total goals scored across all gameweeks
    const { data: totalGoals } = await supabaseAdmin
      .from('results')
      .select('goals')
      .in('player_id', [
        // This would need player IDs - for now return 0
      ])

    const goalsScored = totalGoals?.reduce((sum, result) => sum + (result.goals || 0), 0) || 0

    // Prepare performance data
    const performance = {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
      },
      standing: userStanding,
      recentForm,
      stats: {
        totalGoalsScored: goalsScored,
        matchesPlayed: userStanding?.played || 0,
        wins: userStanding?.won || 0,
        draws: userStanding?.drawn || 0,
        losses: userStanding?.lost || 0,
        points: userStanding?.points || 0,
        position: userStanding?.position || null
      },
      goalHistory: goalHistory || []
    }

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Error fetching user performance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}