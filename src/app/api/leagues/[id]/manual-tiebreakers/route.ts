import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Fetch manual tiebreakers for a league
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: leagueId } = await params

    const { data: tiebreakers, error } = await supabaseAdmin
      .from('manual_tiebreakers')
      .select(`
        id,
        league_id,
        manager_id,
        tiebreaker_value,
        created_at,
        updated_at
      `)
      .eq('league_id', leagueId)
      .order('tiebreaker_value', { ascending: true })

    if (error) {
      console.error('Error fetching manual tiebreakers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch manual tiebreakers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tiebreakers: tiebreakers || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Set/update manual tiebreakers for a league (batch operation)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: leagueId } = await params
    const body = await request.json()
    const { tiebreakers } = body

    if (!Array.isArray(tiebreakers)) {
      return NextResponse.json(
        { error: 'tiebreakers must be an array' },
        { status: 400 }
      )
    }

    // Validate tiebreakers format
    for (const tb of tiebreakers) {
      if (!tb.manager_id || typeof tb.tiebreaker_value !== 'number' || tb.tiebreaker_value < 1) {
        return NextResponse.json(
          { error: 'Each tiebreaker must have manager_id and tiebreaker_value (positive integer)' },
          { status: 400 }
        )
      }
    }

    // Delete existing tiebreakers for this league
    const { error: deleteError } = await supabaseAdmin
      .from('manual_tiebreakers')
      .delete()
      .eq('league_id', leagueId)

    if (deleteError) {
      console.error('Error deleting existing tiebreakers:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing tiebreakers' },
        { status: 500 }
      )
    }

    // Insert new tiebreakers if any provided
    if (tiebreakers.length > 0) {
      const tiebreakerData = tiebreakers.map(tb => ({
        league_id: leagueId,
        manager_id: tb.manager_id,
        tiebreaker_value: tb.tiebreaker_value
      }))

      const { error: insertError } = await supabaseAdmin
        .from('manual_tiebreakers')
        .insert(tiebreakerData)

      if (insertError) {
        console.error('Error inserting tiebreakers:', insertError)
        return NextResponse.json(
          { error: 'Failed to save tiebreakers' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Manual tiebreakers updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear all manual tiebreakers for a league
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: leagueId } = await params

    const { error } = await supabaseAdmin
      .from('manual_tiebreakers')
      .delete()
      .eq('league_id', leagueId)

    if (error) {
      console.error('Error deleting tiebreakers:', error)
      return NextResponse.json(
        { error: 'Failed to delete tiebreakers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Manual tiebreakers cleared successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
