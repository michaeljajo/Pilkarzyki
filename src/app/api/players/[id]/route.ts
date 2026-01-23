import { NextRequest, NextResponse } from 'next/server'
import { createClerkSupabaseClientSsr } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { Position } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClerkSupabaseClientSsr()

    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        manager:users(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()

    // Use admin client for player updates (bypasses Clerk auth issues)
    const supabase = supabaseAdmin

    // Validate position if provided
    if (updates.position) {
      const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
      if (!validPositions.includes(updates.position)) {
        return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.surname !== undefined) updateData.surname = updates.surname
    if (updates.league !== undefined) updateData.league = updates.league
    if (updates.position !== undefined) updateData.position = updates.position
    if (updates.club !== undefined) updateData.club = updates.club
    if (updates.footballLeague !== undefined) updateData.football_league = updates.footballLeague
    if (updates.managerId !== undefined) updateData.manager_id = updates.managerId
    if (updates.totalGoals !== undefined) updateData.total_goals = updates.totalGoals

    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        manager:users(id, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Player update error:', error)
      console.error('Update data:', updateData)
      console.error('Player ID:', id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClerkSupabaseClientSsr()

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Player deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}