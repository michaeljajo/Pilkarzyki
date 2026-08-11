import { NextRequest, NextResponse } from 'next/server'
import { createClerkSupabaseClientSsr } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { Position } from '@/types'
import { assertLeagueMutable, requireLeagueAdmin } from '@/lib/auth-helpers'

async function assertPlayerLeagueMutable(playerId: string) {
  const { data } = await supabaseAdmin
    .from('players')
    .select('league_id')
    .eq('id', playerId)
    .maybeSingle()
  if (!data?.league_id) {
    return { ok: true as const }
  }
  return assertLeagueMutable(data.league_id)
}

/**
 * Admin guard for a player, resolved through the league the player belongs
 * to. Resolved by league_id rather than name: names are not unique, so a
 * name-based guard let an admin of one league edit players in another that
 * happened to share its name.
 *
 * Unlike assertPlayerLeagueMutable this fails closed when the player has no
 * league — an unattributable player must not be editable by an arbitrary
 * signed-in user.
 */
async function requirePlayerLeagueAdmin(clerkUserId: string, playerId: string) {
  const { data } = await supabaseAdmin
    .from('players')
    .select('league_id')
    .eq('id', playerId)
    .maybeSingle()

  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono zawodnika.' }
  }
  if (!data.league_id) {
    return { ok: false as const, status: 403, error: 'Zawodnik nie należy do żadnej ligi.' }
  }
  return requireLeagueAdmin(clerkUserId, data.league_id)
}

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

    const admin = await requirePlayerLeagueAdmin(userId, id)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }
    // Moving a player into another league requires admin rights there too.
    if (updates.league_id) {
      const targetAdmin = await requireLeagueAdmin(userId, updates.league_id)
      if (!targetAdmin.ok) {
        return NextResponse.json({ error: targetAdmin.error }, { status: targetAdmin.status })
      }
    }

    const mutable = await assertPlayerLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }
    if (updates.league_id) {
      const targetMutable = await assertLeagueMutable(updates.league_id)
      if (!targetMutable.ok) {
        return NextResponse.json({ error: targetMutable.error }, { status: targetMutable.status })
      }
    }

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

    const admin = await requirePlayerLeagueAdmin(userId, id)
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const mutable = await assertPlayerLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

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