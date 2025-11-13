import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { resolvePlaceholder } from '@/utils/knockout-resolver'

/**
 * POST - Attempt to resolve all unresolved placeholders in knockout matches
 * This is useful when group stage completes and we want to update all matches at once
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

    // Fetch all knockout matches with unresolved placeholders
    const { data: unresolvedMatches } = await supabaseAdmin
      .from('cup_matches')
      .select('*')
      .eq('cup_id', cupId)
      .neq('stage', 'group_stage')
      .or('home_manager_id.is.null,away_manager_id.is.null')

    if (!unresolvedMatches || unresolvedMatches.length === 0) {
      return NextResponse.json({
        message: 'All placeholders already resolved',
        resolvedCount: 0,
        totalChecked: 0
      })
    }

    let resolvedCount = 0
    const resolutionResults = []

    // Try to resolve each match
    for (const match of unresolvedMatches) {
      let homeResolved = false
      let awayResolved = false
      let homeManagerId = match.home_manager_id
      let awayManagerId = match.away_manager_id

      // Try to resolve home team if not already resolved
      if (!match.home_manager_id && match.home_team_source) {
        const homeResult = await resolvePlaceholder(match.home_team_source, cupId)
        if (homeResult.managerId) {
          homeManagerId = homeResult.managerId
          homeResolved = true
        }
      }

      // Try to resolve away team if not already resolved
      if (!match.away_manager_id && match.away_team_source) {
        const awayResult = await resolvePlaceholder(match.away_team_source, cupId)
        if (awayResult.managerId) {
          awayManagerId = awayResult.managerId
          awayResolved = true
        }
      }

      // Update match if any resolution occurred
      if (homeResolved || awayResolved) {
        const { error: updateError } = await supabaseAdmin
          .from('cup_matches')
          .update({
            home_manager_id: homeManagerId,
            away_manager_id: awayManagerId
          })
          .eq('id', match.id)

        if (!updateError) {
          resolvedCount++
          resolutionResults.push({
            matchId: match.id,
            stage: match.stage,
            homeResolved,
            awayResolved,
            homeTeam: homeManagerId || match.home_team_source,
            awayTeam: awayManagerId || match.away_team_source
          })
        }
      }
    }

    return NextResponse.json({
      message: `Successfully resolved ${resolvedCount} match(es)`,
      resolvedCount,
      totalChecked: unresolvedMatches.length,
      details: resolutionResults
    })
  } catch (error) {
    console.error('Error resolving placeholders:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
