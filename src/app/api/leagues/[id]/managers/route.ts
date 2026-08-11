import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { verifyLeagueAdmin, assertLeagueMutable } from '@/lib/auth-helpers'
import { LEAGUE_LIMITS, VALIDATION_MESSAGES } from '@/config/constants'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    // Get managers from squads table with user details
    const { data, error } = await supabaseAdmin
      .from('squads')
      .select(`
        id,
        manager_id,
        users!squads_manager_id_fkey(
          id,
          clerk_id,
          email,
          first_name,
          last_name,
          is_admin,
          created_at
        )
      `)
      .eq('league_id', id)


    if (error) {
      console.error('Error fetching managers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match expected User interface.
    // GDPR: we never send email addresses to the client here. The managers list
    // renders `displayName` — a non-identifying handle (Clerk username, else the
    // local-part of the email) — while firstName/lastName are kept for other
    // consumers of this endpoint. We batch-load the Clerk profiles in one call
    // so we always have the real username/email and never leak the "Admin User"
    // / <prefix>-<clerkId>@temp.com placeholders left in legacy mirror rows.
     
    const rows: any[] = (data || []).map((squad: any) => squad.users).filter(Boolean)
    const clerkIds = rows.map((u) => u.clerk_id).filter(Boolean)

     
    const clerkById = new Map<string, any>()
    if (clerkIds.length > 0) {
      try {
        const client = await clerkClient()
        const list = await client.users.getUserList({ userId: clerkIds, limit: clerkIds.length })
        for (const cu of list.data) clerkById.set(cu.id, cu)
      } catch (e) {
        logger.warn('Managers GET - Clerk batch lookup failed:', e)
      }
    }

    const managers = rows.map((u) => {
      const clerkUser = clerkById.get(u.clerk_id)

      // Prefer the live Clerk profile; only fall back to the mirror row, and
      // never trust a @temp.com placeholder email.
      const realEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
      const dbEmail = typeof u.email === 'string' && !u.email.endsWith('@temp.com') ? u.email : ''
      const email = realEmail || dbEmail

      const { firstName, lastName } = resolveUserNames({
        email,
        first_name: clerkUser ? clerkUser.firstName : u.first_name,
        last_name: clerkUser ? clerkUser.lastName : u.last_name,
        username: clerkUser?.username,
      })

      const displayName =
        clerkUser?.username || email.split('@')[0] || firstName || 'Użytkownik'

      return {
        id: u.clerk_id || u.id, // Use Clerk ID for API calls
        clerkId: u.clerk_id,
        databaseId: u.id, // Keep database ID for reference
        displayName,
        firstName,
        lastName,
        isAdmin: u.is_admin,
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.created_at) // Using created_at as fallback
      }
    })

    return NextResponse.json({ managers })
  } catch (error) {
    console.error('GET managers catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: authUserId } = await auth()
    const { id } = await params

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(authUserId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const { userId } = await request.json()

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Find user by Clerk ID (the userId being sent is actually a Clerk ID)
    const { data: foundUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    let user = foundUser

    // If user doesn't exist in our database, create them
    if (userError || !user) {

      // Get user details from Clerk
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()

      try {
        const clerkUser = await client.users.getUser(userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''

        // Use enhanced name resolution logic
        const { firstName, lastName } = resolveUserNames({
          email,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          username: clerkUser.username
        })

        // Create user record in our database
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            is_admin: false, // no global admin: rights are per-league via league_admins
          })
          .select('*')
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        user = newUser
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)
        return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
      }
    }

    // Check if user is already a manager in this league
    const { data: existingSquad } = await supabaseAdmin
      .from('squads')
      .select('*')
      .eq('league_id', id)
      .eq('manager_id', user.id)
      .single()

    if (existingSquad) {
      return NextResponse.json({ error: 'User is already a manager in this league' }, { status: 400 })
    }

    // Enforce the admin-defined league size (leagues.max_managers).
    const maxManagers = league.max_managers ?? LEAGUE_LIMITS.DEFAULT_MANAGERS
    const { count: currentManagerCount, error: countError } = await supabaseAdmin
      .from('squads')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', id)

    if (countError) {
      console.error('Error counting managers:', countError)
      return NextResponse.json({ error: 'Failed to verify league size' }, { status: 500 })
    }

    if (currentManagerCount !== null && currentManagerCount >= maxManagers) {
      return NextResponse.json({ error: VALIDATION_MESSAGES.MANAGER_LIMIT_REACHED }, { status: 400 })
    }

    // Create squad for the manager in this league
    const { data: newSquad, error: squadError } = await supabaseAdmin
      .from('squads')
      .insert({
        league_id: id,
        manager_id: user.id
      })
      .select('*')
      .single()

    if (squadError) {
      console.error('Error creating squad:', squadError)
      return NextResponse.json({ error: 'Failed to add manager to league' }, { status: 500 })
    }

    // Bust the cached dashboard league lists so the newly-added manager sees
    // the league immediately (getUserLeagues is cached under this tag).
    revalidateTag('user-leagues', 'max')
    revalidatePath('/leagues')

    return NextResponse.json({
      success: true,
      manager: user,
      squad: newSquad
    })
  } catch (error) {
    console.error('POST managers catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: authUserId } = await auth()
    const { id } = await params

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(authUserId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(id)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const { managerId } = await request.json()

    if (!managerId) {
      return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 })
    }

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if manager exists in this league
    const { data: existingSquad, error: squadError } = await supabaseAdmin
      .from('squads')
      .select('*')
      .eq('league_id', id)
      .eq('manager_id', managerId)
      .single()

    if (squadError || !existingSquad) {
      return NextResponse.json({ error: 'Manager not found in this league' }, { status: 404 })
    }

    // Remove the manager by deleting their squad record
    const { error: deleteError } = await supabaseAdmin
      .from('squads')
      .delete()
      .eq('league_id', id)
      .eq('manager_id', managerId)

    if (deleteError) {
      console.error('Error removing manager:', deleteError)
      return NextResponse.json({ error: 'Failed to remove manager from league' }, { status: 500 })
    }

    // Bust the cached dashboard league lists so the removed manager stops
    // seeing the league immediately.
    revalidateTag('user-leagues', 'max')
    revalidatePath('/leagues')

    return NextResponse.json({
      success: true,
      message: 'Manager removed from league successfully'
    })
  } catch (error) {
    console.error('DELETE managers catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}