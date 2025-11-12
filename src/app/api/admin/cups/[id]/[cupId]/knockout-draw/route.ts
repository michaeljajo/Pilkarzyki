import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import {
  resolveMatchPairings,
  validateGroupStageComplete,
  type MatchPairing
} from '@/utils/knockout-resolver'
import { CupStage } from '@/types'

interface KnockoutDrawRequest {
  stage: CupStage
  matches: MatchPairing[]
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

    const { id: cupId } = await context.params

    // Get cup and verify it exists
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('id, league_id, stage')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    // Verify user is admin of the league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const body: KnockoutDrawRequest = await request.json()

    if (!body.stage || !body.matches || !Array.isArray(body.matches)) {
      return NextResponse.json({
        error: 'Missing required fields: stage, matches'
      }, { status: 400 })
    }

    // Validate stage
    const validKnockoutStages: CupStage[] = ['round_of_16', 'quarter_final', 'semi_final', 'final']
    if (!validKnockoutStages.includes(body.stage)) {
      return NextResponse.json({
        error: `Invalid knockout stage. Must be one of: ${validKnockoutStages.join(', ')}`
      }, { status: 400 })
    }

    // Validate group stage is complete (for first knockout round)
    if (body.stage === 'round_of_16') {
      const validation = await validateGroupStageComplete(cupId)
      if (!validation.isComplete) {
        return NextResponse.json({
          error: validation.error || 'Group stage must be complete before creating knockout matches'
        }, { status: 400 })
      }
    }

    // Resolve placeholders to actual manager IDs
    const { resolved, errors } = await resolveMatchPairings(body.matches, cupId)

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Failed to resolve match pairings',
        details: errors
      }, { status: 400 })
    }

    // Get cup gameweeks for this stage
    const { data: cupGameweeks, error: gameweeksError } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, cup_week, leg')
      .eq('cup_id', cupId)
      .eq('stage', body.stage)
      .order('leg', { ascending: true })

    if (gameweeksError || !cupGameweeks || cupGameweeks.length === 0) {
      return NextResponse.json({
        error: `No cup gameweeks found for stage ${body.stage}. Please ensure cup gameweeks are set up.`
      }, { status: 400 })
    }

    // Create a map of cup_gameweek_id to gameweek data
    const gameweekMap = new Map(cupGameweeks.map(gw => [gw.id, gw]))

    // Validate all specified cup gameweek IDs exist
    const invalidGameweeks = resolved.filter(r => !gameweekMap.has(r.cupGameweekId))
    if (invalidGameweeks.length > 0) {
      return NextResponse.json({
        error: 'Some cup gameweek IDs are invalid',
        details: invalidGameweeks.map(r => r.cupGameweekId)
      }, { status: 400 })
    }

    // Check if matches already exist for this stage
    const { data: existingMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('id')
      .eq('cup_id', cupId)
      .eq('stage', body.stage)
      .limit(1)

    if (existingMatches && existingMatches.length > 0) {
      return NextResponse.json({
        error: `Matches for ${body.stage} already exist. Delete them first if you want to recreate.`
      }, { status: 400 })
    }

    // Create matches
    const matchesToInsert = resolved.map(pairing => {
      const gameweek = gameweekMap.get(pairing.cupGameweekId)!

      return {
        cup_id: cupId,
        cup_gameweek_id: pairing.cupGameweekId,
        home_manager_id: pairing.homeManagerId,
        away_manager_id: pairing.awayManagerId,
        stage: body.stage,
        leg: gameweek.leg,
        group_name: null, // Knockout matches don't have groups
        is_completed: false
      }
    })

    const { data: createdMatches, error: insertError } = await supabaseAdmin
      .from('cup_matches')
      .insert(matchesToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create matches',
        details: insertError.message
      }, { status: 500 })
    }

    // Update cup stage if needed
    const stageOrder: CupStage[] = ['group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final']
    const currentStageIndex = stageOrder.indexOf(cup.stage as CupStage)
    const newStageIndex = stageOrder.indexOf(body.stage)

    if (newStageIndex > currentStageIndex) {
      await supabaseAdmin
        .from('cups')
        .update({ stage: body.stage })
        .eq('id', cupId)
    }

    return NextResponse.json({
      message: `Successfully created ${createdMatches.length} matches for ${body.stage}`,
      matches: createdMatches,
      stats: {
        stage: body.stage,
        matchesCreated: createdMatches.length,
        legsPerTie: body.stage === 'final' ? 1 : 2
      }
    })

  } catch (error) {
    console.error('Error creating knockout draw:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
