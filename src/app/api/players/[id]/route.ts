import { NextRequest, NextResponse } from 'next/server'
import { createClerkSupabaseClientSsr } from '@/lib/supabase-server'
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

    const supabase = await createClerkSupabaseClientSsr()

    // Validate position if provided
    if (updates.position) {
      const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
      if (!validPositions.includes(updates.position)) {
        return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('players')
      .update({
        name: updates.name,
        surname: updates.surname,
        league: updates.league,
        position: updates.position,
        manager_id: updates.managerId,
        total_goals: updates.totalGoals,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        manager:users(id, first_name, last_name)
      `)
      .single()

    if (error) {
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