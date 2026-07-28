import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin, assertLeagueMutableByCup } from '@/lib/auth-helpers'
import { getNextStage } from '@/utils/cup-scheduling'
import { recalculateCupGroupStandings } from '@/utils/standings-calculator'
import { DEFAULT_CUP_FORMAT } from '@/lib/cup-format'
import type { CupFormat } from '@/types'

/**
 * POST /api/cups/[id]/advance
 * Advance the cup out of the group stage into the first knockout round.
 * This will:
 * 1. Verify the group stage is completed
 * 2. Recompute standings and mark qualifiers per the cup format
 *    (positions 1..topPerGroup per group + best remaining)
 * 3. Set the cup stage to the first knockout round
 *
 * It does NOT auto-generate the bracket: the admin performs the manual draw
 * (which resolves the A1…B4 placeholders once qualification is settled).
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

    const mutable = await assertLeagueMutableByCup(cupId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    // Get cup details
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('id, league_id, stage, format')
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

      const format = (cup.format as CupFormat | undefined) ?? DEFAULT_CUP_FORMAT

      // Recompute standings so `qualified` reflects the current format
      // (positions 1..topPerGroup per group + best remaining across groups).
      await recalculateCupGroupStandings(cupId)

      // Read the freshly-marked qualifiers.
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

      const totalQualifiers = standings.length

      // Determine the first knockout stage from the format, matched to the
      // actual number of qualifiers.
      const nextStage = getNextStage('group_stage', format, totalQualifiers)
      if (!nextStage) {
        return NextResponse.json({ error: 'Cannot determine next stage' }, { status: 400 })
      }

      // The knockout gameweeks must already exist (created with the schedule).
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

      // Set the cup stage to the first knockout round. The bracket itself is
      // NOT auto-generated — the admin performs the manual draw, which resolves
      // the A1…B4 placeholders now that qualification is settled.
      const { error: updateError } = await supabaseAdmin
        .from('cups')
        .update({ stage: nextStage })
        .eq('id', cupId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: `Cup advanced to ${nextStage}. Perform the knockout draw to create the ties.`,
        stage: nextStage,
        qualifiedTeams: totalQualifiers,
        requiresManualDraw: true
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
