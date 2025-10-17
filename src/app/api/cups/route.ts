import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { canLeagueHaveCup } from '@/utils/cup-scheduling'

/**
 * GET /api/cups?leagueId=xxx
 * Fetch cup for a specific league
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')

    if (!leagueId) {
      return NextResponse.json({ error: 'leagueId is required' }, { status: 400 })
    }

    // Fetch cup for this league
    const { data: cup, error } = await supabaseAdmin
      .from('cups')
      .select(`
        *,
        leagues (
          id,
          name,
          season
        )
      `)
      .eq('league_id', leagueId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cup: cup || null })
  } catch (error) {
    console.error('Error fetching cup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cups
 * Create a new cup tournament for a league
 * Body: { leagueId: string, name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leagueId, name } = await request.json()

    if (!leagueId || !name) {
      return NextResponse.json({ error: 'leagueId and name are required' }, { status: 400 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Check if cup already exists for this league
    const { data: existingCup } = await supabaseAdmin
      .from('cups')
      .select('id')
      .eq('league_id', leagueId)
      .single()

    if (existingCup) {
      return NextResponse.json({ error: 'Cup already exists for this league' }, { status: 400 })
    }

    // Validate league has correct number of managers (8, 16, or 32)
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('squads')
      .select('manager_id')
      .eq('league_id', leagueId)

    if (managersError) {
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    const managerCount = managers?.length || 0
    if (!canLeagueHaveCup(managerCount)) {
      return NextResponse.json(
        { error: `Cup tournaments require exactly 4, 8, 16, or 32 managers. This league has ${managerCount}.` },
        { status: 400 }
      )
    }

    // Create cup
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .insert({
        league_id: leagueId,
        name,
        stage: 'group_stage',
        is_active: true
      })
      .select()
      .single()

    if (cupError) {
      return NextResponse.json({ error: cupError.message }, { status: 500 })
    }

    return NextResponse.json({ cup }, { status: 201 })
  } catch (error) {
    console.error('Error creating cup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/cups?cupId=xxx
 * Delete a cup tournament
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cupId = searchParams.get('cupId')

    if (!cupId) {
      return NextResponse.json({ error: 'cupId is required' }, { status: 400 })
    }

    // Get cup and verify admin access
    const { data: cup, error: cupError } = await supabaseAdmin
      .from('cups')
      .select('league_id')
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

    // Delete cup (cascades to all related tables)
    const { error: deleteError } = await supabaseAdmin
      .from('cups')
      .delete()
      .eq('id', cupId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Cup deleted successfully' })
  } catch (error) {
    console.error('Error deleting cup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
