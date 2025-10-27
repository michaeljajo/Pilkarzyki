import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameweekId: string }> }
) {
  try {
    const { userId } = await auth()
    const { id, gameweekId } = await params
    console.log('PATCH /api/leagues/[id]/gameweeks/[gameweekId] - userId:', userId, 'leagueId:', id, 'gameweekId:', gameweekId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { start_date, end_date, lock_date, is_completed, is_locked } = body
    console.log('Update gameweek data:', body)

    // Verify gameweek belongs to this league
    const { data: existingGameweek, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('*')
      .eq('id', gameweekId)
      .eq('league_id', id)
      .single()

    if (fetchError || !existingGameweek) {
      return NextResponse.json({ error: 'Gameweek not found' }, { status: 404 })
    }

    // Update gameweek
    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .update({
        start_date: start_date || existingGameweek.start_date,
        end_date: end_date || existingGameweek.end_date,
        lock_date: lock_date || existingGameweek.lock_date,
        is_completed: is_completed !== undefined ? is_completed : existingGameweek.is_completed,
        is_locked: is_locked !== undefined ? is_locked : existingGameweek.is_locked,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameweekId)
      .select()
      .single()

    if (error) {
      console.error('Error updating gameweek:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully updated gameweek:', data)
    return NextResponse.json({ gameweek: data })
  } catch (error) {
    console.error('PATCH gameweek catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameweekId: string }> }
) {
  try {
    const { userId } = await auth()
    const { id, gameweekId } = await params
    console.log('DELETE /api/leagues/[id]/gameweeks/[gameweekId] - userId:', userId, 'leagueId:', id, 'gameweekId:', gameweekId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Verify gameweek belongs to this league
    const { data: existingGameweek, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('*')
      .eq('id', gameweekId)
      .eq('league_id', id)
      .single()

    if (fetchError || !existingGameweek) {
      return NextResponse.json({ error: 'Gameweek not found' }, { status: 404 })
    }

    // Delete gameweek
    const { error } = await supabaseAdmin
      .from('gameweeks')
      .delete()
      .eq('id', gameweekId)

    if (error) {
      console.error('Error deleting gameweek:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully deleted gameweek')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE gameweek catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
