import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is a request for a specific league
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('id')

    if (leagueId) {
      return await getSpecificLeague(userId, leagueId)
    }

    // Get user record, create if doesn't exist
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()


    if (!userRecord) {

      try {
        // Fetch user from Clerk
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)

        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const { firstName, lastName } = resolveUserNames({
          email,
          first_name: clerkUser.firstName || undefined,
          last_name: clerkUser.lastName || undefined,
          username: clerkUser.username || undefined
        })

        // Create user in Supabase
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            is_admin: clerkUser.publicMetadata?.isAdmin === true
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error creating user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user in database' }, { status: 500 })
        }

        userRecord = newUser
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)

        // Fallback: create user with minimal information
        // Extract email from error message or use clerk ID as fallback
        const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email: fallbackEmail,
            first_name: 'User',
            last_name: '',
            is_admin: false
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error creating fallback user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
      }
    }

    // Get leagues where user is assigned as manager (via squads table) OR where user is admin
    const [{ data: participantLeagues, error: participantError }, { data: adminLeagues, error: adminError }] = await Promise.all([
      // Leagues where user participates (has players)
      supabaseAdmin
        .from('leagues')
        .select(`
          *,
          squads!inner(manager_id)
        `)
        .eq('squads.manager_id', userRecord.id)
        .eq('is_active', true),

      // Leagues where user is admin (via league_admins table)
      supabaseAdmin
        .from('leagues')
        .select(`
          *,
          league_admins!inner(user_id)
        `)
        .eq('league_admins.user_id', userRecord.id)
        .eq('is_active', true)
    ])


    if (participantError || adminError) {
      console.error('Error fetching manager leagues:', { participantError, adminError })
      return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 })
    }

    // Combine and deduplicate leagues (in case user is both admin and participant)
    const allLeagues = [...(participantLeagues || []), ...(adminLeagues || [])]
    const uniqueLeagues = allLeagues.filter((league, index, array) =>
      array.findIndex(l => l.id === league.id) === index
    )

    return NextResponse.json({ leagues: uniqueLeagues })
  } catch (error) {
    console.error('Error in manager leagues API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getSpecificLeague(userId: string, leagueId: string) {
  try {

    // Get user information to verify they have access to this league
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get league details
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select(`
        id,
        name,
        season,
        current_gameweek,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', leagueId)
      .single()


    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if user has any players in this league (which means they're a participant)
    const { data: userPlayers } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('manager_id', user.id)
      .eq('league', league.name) // Players are assigned by league name
      .limit(1)

    // Check if user is admin of this league using the league_admins table
    const { isAdmin } = await verifyLeagueAdmin(userId, leagueId)

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        season: league.season,
        current_gameweek: league.current_gameweek,
        is_active: league.is_active,
        created_at: league.created_at,
        updated_at: league.updated_at,
        user_is_participant: userPlayers && userPlayers.length > 0,
        user_is_admin: isAdmin
      }
    })
  } catch (error) {
    console.error('Error fetching specific league for manager:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}