import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import {
  resolvePlaceholder,
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

    // NOTE: We no longer validate group stage completion - allow pre-configuration!

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
    const invalidGameweeks = body.matches.filter(m => !gameweekMap.has(m.cupGameweekId))
    if (invalidGameweeks.length > 0) {
      return NextResponse.json({
        error: 'Some cup gameweek IDs are invalid',
        details: invalidGameweeks.map(m => m.cupGameweekId)
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

    // Determine if this stage has two legs (all stages except final)
    const isTwoLegged = body.stage !== 'final'

    // Get leg 1 and leg 2 gameweeks
    const leg1Gameweek = cupGameweeks.find(gw => gw.leg === 1)
    const leg2Gameweek = cupGameweeks.find(gw => gw.leg === 2)

    if (!leg1Gameweek) {
      return NextResponse.json({
        error: `No leg 1 gameweek found for stage ${body.stage}`
      }, { status: 400 })
    }

    if (isTwoLegged && !leg2Gameweek) {
      return NextResponse.json({
        error: `No leg 2 gameweek found for stage ${body.stage}. Two-legged ties require both legs to be configured.`
      }, { status: 400 })
    }

    // Create matches for both legs (or just leg 1 for finals)
    // Assign match numbers for knockout stages (QF1, QF2, SF1, SF2, etc.)
    const matchesWithResolution = await Promise.all(
      body.matches.flatMap(async (pairing, index) => {
        // Try to resolve, but allow null if not yet qualified
        const homeResolution = await resolvePlaceholder(pairing.homeManager, cupId)
        const awayResolution = await resolvePlaceholder(pairing.awayManager, cupId)

        // Match number is 1-indexed (QF1, QF2, QF3, QF4)
        const matchNumber = index + 1

        const matches = [
          // Leg 1
          {
            cup_id: cupId,
            cup_gameweek_id: leg1Gameweek.id,
            home_manager_id: homeResolution.managerId || null,
            away_manager_id: awayResolution.managerId || null,
            home_team_source: pairing.homeManager,
            away_team_source: pairing.awayManager,
            stage: body.stage,
            leg: 1,
            match_number: matchNumber,
            group_name: null,
            is_completed: false
          }
        ]

        // Add leg 2 for two-legged ties (with home/away reversed)
        if (isTwoLegged && leg2Gameweek) {
          matches.push({
            cup_id: cupId,
            cup_gameweek_id: leg2Gameweek.id,
            home_manager_id: awayResolution.managerId || null,  // Reversed
            away_manager_id: homeResolution.managerId || null,  // Reversed
            home_team_source: pairing.awayManager,  // Reversed
            away_team_source: pairing.homeManager,  // Reversed
            stage: body.stage,
            leg: 2,
            match_number: matchNumber,  // Same match number for both legs
            group_name: null,
            is_completed: false
          })
        }

        return matches
      })
    )

    // Flatten the array since flatMap with async doesn't work as expected
    const matchesToInsert = (await Promise.all(matchesWithResolution)).flat()

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

    // If this is semi-finals, automatically create the final match (SF1 vs SF2)
    let finalMatch = null
    if (body.stage === 'semi_final') {
      // Get the final gameweek
      const { data: finalGameweeks } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('id, leg')
        .eq('cup_id', cupId)
        .eq('stage', 'final')
        .order('leg', { ascending: true })

      if (finalGameweeks && finalGameweeks.length > 0) {
        // Finals are single-leg, so just get leg 1
        const finalGameweek = finalGameweeks.find(gw => gw.leg === 1)

        if (finalGameweek) {
          // Create the final match: SF1 vs SF2
          const { data: createdFinal } = await supabaseAdmin
            .from('cup_matches')
            .insert({
              cup_id: cupId,
              cup_gameweek_id: finalGameweek.id,
              home_manager_id: null,
              away_manager_id: null,
              home_team_source: 'SF1',
              away_team_source: 'SF2',
              stage: 'final',
              leg: 1,
              match_number: 1,
              group_name: null,
              is_completed: false
            })
            .select()
            .single()

          finalMatch = createdFinal
        }
      }
    }

    return NextResponse.json({
      message: `Successfully created ${createdMatches.length} matches for ${body.stage}${finalMatch ? ' and auto-created the final' : ''}`,
      matches: createdMatches,
      finalMatch,
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

/**
 * GET - Fetch configured knockout stages with resolution status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    // Get cup and verify access
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, league_id')
      .eq('id', cupId)
      .single()

    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    const { isAdmin } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all knockout matches
    const { data: matches } = await supabaseAdmin
      .from('cup_matches')
      .select('*')
      .eq('cup_id', cupId)
      .neq('stage', 'group_stage')
      .order('stage')
      .order('leg')

    if (!matches || matches.length === 0) {
      return NextResponse.json({ stages: [] })
    }

    // Group by stage and calculate stats
    const stageMap = new Map<string, any>()

    for (const match of matches) {
      if (!stageMap.has(match.stage)) {
        stageMap.set(match.stage, {
          stage: match.stage,
          matchesCount: 0,
          totalCount: 0,
          resolvedCount: 0,
          completedCount: 0
        })
      }

      const stageInfo = stageMap.get(match.stage)!
      stageInfo.matchesCount++
      stageInfo.totalCount += 2 // Each match has 2 teams

      if (match.home_manager_id) stageInfo.resolvedCount++
      if (match.away_manager_id) stageInfo.resolvedCount++
      if (match.is_completed) stageInfo.completedCount++
    }

    const stages = Array.from(stageMap.values())

    return NextResponse.json({ stages })
  } catch (error) {
    console.error('Error fetching knockout stages:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT - Update existing knockout matches for a stage
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    // Get cup and verify access
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, league_id')
      .eq('id', cupId)
      .single()

    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    const { isAdmin } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: KnockoutDrawRequest = await request.json()

    if (!body.stage || !body.matches || !Array.isArray(body.matches)) {
      return NextResponse.json({
        error: 'Missing required fields: stage, matches'
      }, { status: 400 })
    }

    // Check if any matches have results
    const { data: existingMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('id, is_completed, home_score, away_score')
      .eq('cup_id', cupId)
      .eq('stage', body.stage)

    const hasResults = existingMatches?.some(m => m.home_score !== null || m.away_score !== null) || false

    // Delete existing matches for this stage
    const { error: deleteError } = await supabaseAdmin
      .from('cup_matches')
      .delete()
      .eq('cup_id', cupId)
      .eq('stage', body.stage)

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete existing matches',
        details: deleteError.message
      }, { status: 500 })
    }

    // Get cup gameweeks for this stage
    const { data: cupGameweeks } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, cup_week, leg')
      .eq('cup_id', cupId)
      .eq('stage', body.stage)
      .order('leg', { ascending: true })

    if (!cupGameweeks || cupGameweeks.length === 0) {
      return NextResponse.json({
        error: `No cup gameweeks found for stage ${body.stage}`
      }, { status: 400 })
    }

    // Determine if this stage has two legs (all stages except final)
    const isTwoLegged = body.stage !== 'final'

    // Get leg 1 and leg 2 gameweeks
    const leg1Gameweek = cupGameweeks.find(gw => gw.leg === 1)
    const leg2Gameweek = cupGameweeks.find(gw => gw.leg === 2)

    if (!leg1Gameweek) {
      return NextResponse.json({
        error: `No leg 1 gameweek found for stage ${body.stage}`
      }, { status: 400 })
    }

    if (isTwoLegged && !leg2Gameweek) {
      return NextResponse.json({
        error: `No leg 2 gameweek found for stage ${body.stage}. Two-legged ties require both legs to be configured.`
      }, { status: 400 })
    }

    // Create new matches with updated placeholders for both legs
    // Assign match numbers for knockout stages (QF1, QF2, SF1, SF2, etc.)
    const matchesWithResolution = await Promise.all(
      body.matches.flatMap(async (pairing, index) => {
        const homeResolution = await resolvePlaceholder(pairing.homeManager, cupId)
        const awayResolution = await resolvePlaceholder(pairing.awayManager, cupId)

        // Match number is 1-indexed (QF1, QF2, QF3, QF4)
        const matchNumber = index + 1

        const matches = [
          // Leg 1
          {
            cup_id: cupId,
            cup_gameweek_id: leg1Gameweek.id,
            home_manager_id: homeResolution.managerId || null,
            away_manager_id: awayResolution.managerId || null,
            home_team_source: pairing.homeManager,
            away_team_source: pairing.awayManager,
            stage: body.stage,
            leg: 1,
            match_number: matchNumber,
            group_name: null,
            is_completed: false
          }
        ]

        // Add leg 2 for two-legged ties (with home/away reversed)
        if (isTwoLegged && leg2Gameweek) {
          matches.push({
            cup_id: cupId,
            cup_gameweek_id: leg2Gameweek.id,
            home_manager_id: awayResolution.managerId || null,  // Reversed
            away_manager_id: homeResolution.managerId || null,  // Reversed
            home_team_source: pairing.awayManager,  // Reversed
            away_team_source: pairing.homeManager,  // Reversed
            stage: body.stage,
            leg: 2,
            match_number: matchNumber,  // Same match number for both legs
            group_name: null,
            is_completed: false
          })
        }

        return matches
      })
    )

    // Flatten the array since flatMap with async doesn't work as expected
    const matchesToInsert = (await Promise.all(matchesWithResolution)).flat()

    const { data: createdMatches, error: insertError } = await supabaseAdmin
      .from('cup_matches')
      .insert(matchesToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create updated matches',
        details: insertError.message
      }, { status: 500 })
    }

    // If this is semi-finals, automatically create/update the final match (SF1 vs SF2)
    let finalMatch = null
    if (body.stage === 'semi_final') {
      // First, delete any existing final
      await supabaseAdmin
        .from('cup_matches')
        .delete()
        .eq('cup_id', cupId)
        .eq('stage', 'final')

      // Get the final gameweek
      const { data: finalGameweeks } = await supabaseAdmin
        .from('cup_gameweeks')
        .select('id, leg')
        .eq('cup_id', cupId)
        .eq('stage', 'final')
        .order('leg', { ascending: true })

      if (finalGameweeks && finalGameweeks.length > 0) {
        // Finals are single-leg, so just get leg 1
        const finalGameweek = finalGameweeks.find(gw => gw.leg === 1)

        if (finalGameweek) {
          // Create the final match: SF1 vs SF2
          const { data: createdFinal } = await supabaseAdmin
            .from('cup_matches')
            .insert({
              cup_id: cupId,
              cup_gameweek_id: finalGameweek.id,
              home_manager_id: null,
              away_manager_id: null,
              home_team_source: 'SF1',
              away_team_source: 'SF2',
              stage: 'final',
              leg: 1,
              match_number: 1,
              group_name: null,
              is_completed: false
            })
            .select()
            .single()

          finalMatch = createdFinal
        }
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${createdMatches.length} matches for ${body.stage}${finalMatch ? ' and auto-created the final' : ''}`,
      matches: createdMatches,
      finalMatch,
      hadResults: hasResults,
      warning: hasResults ? 'Previous results were deleted' : null
    })
  } catch (error) {
    console.error('Error updating knockout draw:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE - Delete all matches for a specific stage
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params
    const searchParams = request.nextUrl.searchParams
    const stage = searchParams.get('stage')

    if (!stage) {
      return NextResponse.json({
        error: 'Missing required parameter: stage'
      }, { status: 400 })
    }

    // Get cup and verify access
    const { data: cup } = await supabaseAdmin
      .from('cups')
      .select('id, league_id')
      .eq('id', cupId)
      .single()

    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    const { isAdmin } = await verifyLeagueAdmin(userId, cup.league_id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if stage has completed matches
    const { data: existingMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('id, is_completed, home_score, away_score')
      .eq('cup_id', cupId)
      .eq('stage', stage)

    if (!existingMatches || existingMatches.length === 0) {
      return NextResponse.json({
        error: `No matches found for stage ${stage}`
      }, { status: 404 })
    }

    const hasResults = existingMatches.some(m => m.home_score !== null || m.away_score !== null)
    const confirmed = searchParams.get('confirmed') === 'true'

    if (hasResults && !confirmed) {
      return NextResponse.json({
        error: 'Stage has completed matches with results',
        requiresConfirmation: true,
        matchesWithResults: existingMatches.filter(m => m.home_score !== null || m.away_score !== null).length
      }, { status: 400 })
    }

    // Delete matches
    const { error: deleteError } = await supabaseAdmin
      .from('cup_matches')
      .delete()
      .eq('cup_id', cupId)
      .eq('stage', stage)

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete matches',
        details: deleteError.message
      }, { status: 500 })
    }

    // If deleting semi-finals, also delete the auto-created final
    let finalDeleted = false
    if (stage === 'semi_final') {
      const { error: finalDeleteError } = await supabaseAdmin
        .from('cup_matches')
        .delete()
        .eq('cup_id', cupId)
        .eq('stage', 'final')

      if (!finalDeleteError) {
        finalDeleted = true
      }
    }

    return NextResponse.json({
      message: `Successfully deleted ${existingMatches.length} matches for ${stage}${finalDeleted ? ' and the auto-created final' : ''}`,
      deletedCount: existingMatches.length
    })
  } catch (error) {
    console.error('Error deleting knockout stage:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
