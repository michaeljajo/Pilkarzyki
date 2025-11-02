import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import {
  generateKnockoutBracket,
  getNextStage,
  QualifiedTeam
} from '@/utils/cup-scheduling'

/**
 * POST /api/cups/[id]/advance
 * Advance cup from group stage to knockout stage (or from one knockout stage to the next)
 * This will:
 * 1. Verify group stage is completed
 * 2. Get qualified teams from standings
 * 3. Generate knockout bracket matches
 * 4. Update cup stage
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    // Get cup details
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('id, league_id, stage')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Check current stage
    if (cup.stage === 'group_stage') {
      // Verify all group stage matches are completed
      const { data: groupMatches, error: matchesError } = await supabaseAdmin
        .from('cup_matches')
        .select('id, is_completed')
        .eq('cup_id', cupId)
        .eq('stage', 'group_stage')

      if (matchesError) {
        return NextResponse.json({ error: matchesError.message }, { status: 500 })
      }

      if (!groupMatches || groupMatches.length === 0) {
        return NextResponse.json({ error: 'No group stage matches found' }, { status: 400 })
      }

      const allCompleted = groupMatches.every(match => match.is_completed)
      if (!allCompleted) {
        return NextResponse.json(
          { error: 'Cannot advance: Not all group stage matches are completed' },
          { status: 400 }
        )
      }

      // Get qualified teams from standings (top 2 from each group)
      const { data: standings, error: standingsError } = await supabaseAdmin
        .from('cup_group_standings')
        .select('group_name, manager_id, position, qualified')
        .eq('cup_id', cupId)
        .eq('qualified', true)
        .order('group_name', { ascending: true })
        .order('position', { ascending: true })

      if (standingsError) {
        return NextResponse.json({ error: standingsError.message }, { status: 500 })
      }

      if (!standings || standings.length === 0) {
        return NextResponse.json(
          { error: 'No qualified teams found. Please ensure group standings are calculated.' },
          { status: 400 }
        )
      }

      // Convert to QualifiedTeam format
      const qualifiedTeams: QualifiedTeam[] = standings.map(standing => ({
        groupName: standing.group_name,
        position: standing.position,
        managerId: standing.manager_id
      }))

      // Determine next stage based on number of qualified teams
      const nextStage = getNextStage('group_stage', qualifiedTeams.length)
      if (!nextStage) {
        return NextResponse.json({ error: 'Cannot determine next stage' }, { status: 400 })
      }

      // Get the first cup gameweek for the next stage
      const { data: nextStageGameweeks, error: gameweeksError } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('id, cup_week, stage')
        .eq('cup_id', cupId)
        .eq('stage', nextStage)
        .order('cup_week', { ascending: true })

      if (gameweeksError) {
        return NextResponse.json({ error: gameweeksError.message }, { status: 500 })
      }

      if (!nextStageGameweeks || nextStageGameweeks.length === 0) {
        return NextResponse.json(
          { error: `No gameweeks found for stage: ${nextStage}. Please ensure schedule was generated correctly.` },
          { status: 400 }
        )
      }

      // Generate knockout bracket
      const startWeek = nextStageGameweeks[0].cup_week
      const knockoutMatches = generateKnockoutBracket(qualifiedTeams, startWeek)

      // Create mapping of cup_week to cup_gameweek_id
      const cupGameweekMap: Record<number, string> = {}
      nextStageGameweeks.forEach(gw => {
        cupGameweekMap[gw.cup_week] = gw.id
      })

      // Insert knockout matches
      const cupMatchesToInsert = knockoutMatches.map(match => ({
        cup_id: cupId,
        cup_gameweek_id: cupGameweekMap[match.cupWeek],
        home_manager_id: match.homeManagerId,
        away_manager_id: match.awayManagerId,
        stage: match.stage,
        leg: match.leg,
        group_name: null,
        is_completed: false
      }))

      const { data: insertedMatches, error: insertError } = await supabaseAdmin
        .from('cup_matches')
        .insert(cupMatchesToInsert)
        .select()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      // Update cup stage
      const { error: updateError } = await supabaseAdmin
        .from('cups')
        .update({ stage: nextStage })
        .eq('id', cupId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: `Cup advanced to ${nextStage}`,
        stage: nextStage,
        matchesCreated: insertedMatches.length,
        qualifiedTeams: qualifiedTeams.length
      })
    } else if (cup.stage === 'final') {
      return NextResponse.json({ error: 'Cup is already in final stage' }, { status: 400 })
    } else {
      // Handle knockout to knockout advancement (round_of_16 -> quarter_final, etc.)
      return NextResponse.json(
        { error: 'Knockout to knockout advancement not yet implemented' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error advancing cup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
