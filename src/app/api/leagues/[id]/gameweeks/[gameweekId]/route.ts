import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { verifyLeagueAdmin, assertLeagueMutable } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameweekId: string }> }
) {
  try {
    const { userId } = await auth()
    const { id, gameweekId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const { start_date, end_date, lock_date, is_completed, is_locked } = body

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

    // start_date and lock_date are independent: a gameweek opens Friday 18:00
    // and locks Saturday 00:01. Collapsing them (as this route used to) would
    // wipe the submission window every time an admin touched a gameweek.
    const finalStartDate = start_date || existingGameweek.start_date
    const finalLockDate = lock_date || existingGameweek.lock_date
    const finalEndDate = end_date || existingGameweek.end_date

    if (new Date(finalLockDate) < new Date(finalStartDate)) {
      return NextResponse.json(
        { error: 'Blokada składu nie może wypadać przed startem kolejki.' },
        { status: 400 }
      )
    }

    if (new Date(finalEndDate) < new Date(finalLockDate)) {
      return NextResponse.json(
        { error: 'Koniec kolejki nie może wypadać przed blokadą składu.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .update({
        start_date: finalStartDate,
        end_date: finalEndDate,
        lock_date: finalLockDate,
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

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE gameweek catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
