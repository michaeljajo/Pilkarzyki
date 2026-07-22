import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { ARCHIVED_LEAGUE_ERROR_MESSAGE, assertLeagueMutable } from '@/lib/auth-helpers'
import { LEAGUE_LIMITS, VALIDATION_MESSAGES } from '@/config/constants'

// Bust the cached league lists that power the dashboard ("Moje Ligi") so
// deletes/archives are reflected immediately instead of after the cache TTL.
function revalidateLeagueLists() {
  revalidateTag('user-leagues', 'max')
  revalidatePath('/dashboard')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    console.log('GET /api/leagues/[id] - userId:', userId, 'leagueId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    console.log('League query result:', { data, error })

    if (error) {
      console.error('Error fetching league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user is the admin of this league
    if (data.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    return NextResponse.json({ league: data })
  } catch (error) {
    console.error('GET league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    console.log('PUT /api/leagues/[id] - userId:', userId, 'leagueId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if league exists and user is admin
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id, is_active, name, max_managers')
      .eq('id', id)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    const requestBody = await request.json()
    console.log('Update request body:', requestBody)

    const { name, isActive, maxManagers } = requestBody

    // Archived seasons are read-only: the only edit permitted is un-archiving
    // (isActive: true), which restores the league. Any other change is rejected.
    if (league.is_active === false) {
      const onlyReactivating =
        isActive === true &&
        (name === undefined || name === league.name) &&
        maxManagers === undefined
      if (!onlyReactivating) {
        return NextResponse.json(
          { error: ARCHIVED_LEAGUE_ERROR_MESSAGE },
          { status: 403 }
        )
      }
    }

    // Validate an optional league-size change: within bounds and never below
    // the number of managers already in the league.
    const updates: Record<string, unknown> = {
      name,
      is_active: isActive,
      updated_at: new Date().toISOString()
    }
    if (maxManagers !== undefined) {
      const managerCount = Number(maxManagers)
      if (
        !Number.isInteger(managerCount) ||
        managerCount < LEAGUE_LIMITS.MIN_MANAGERS ||
        managerCount > LEAGUE_LIMITS.MAX_MANAGERS
      ) {
        return NextResponse.json({ error: VALIDATION_MESSAGES.INVALID_MANAGER_COUNT }, { status: 400 })
      }

      const { count: currentManagerCount } = await supabaseAdmin
        .from('squads')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', id)

      if (currentManagerCount !== null && managerCount < currentManagerCount) {
        return NextResponse.json(
          { error: `Liga ma już ${currentManagerCount} menedżerów — nie można ustawić mniejszego limitu.` },
          { status: 400 }
        )
      }

      updates.max_managers = managerCount
    }

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    console.log('League update result:', { data, error })

    if (error) {
      console.error('Error updating league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    revalidateLeagueLists()

    return NextResponse.json({ league: data })
  } catch (error) {
    console.error('PUT league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    console.log('DELETE /api/leagues/[id] - userId:', userId, 'leagueId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if league exists and user is admin
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    if (league.admin_id !== userRecord.id) {
      return NextResponse.json({ error: 'Forbidden: You are not the admin of this league' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const { data, error } = await supabaseAdmin
      .from('leagues')
      .delete()
      .eq('id', id)
      .select('*')
      .single()

    console.log('League delete result:', { data, error })

    if (error) {
      console.error('Error deleting league:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    revalidateLeagueLists()

    return NextResponse.json({ success: true, league: data })
  } catch (error) {
    console.error('DELETE league catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}