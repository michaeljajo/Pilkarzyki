import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const leagueId = resolvedParams.id

    // Check if managerId is provided (admin use case)
    const { searchParams } = new URL(request.url)
    const managerId = searchParams.get('managerId')

    // If managerId is provided, use that for fetching squad
    // Otherwise, use current user's ID
    let targetUserId: string | null = null

    if (managerId) {
      // Admin is requesting another manager's squad
      targetUserId = managerId
    } else {
      // Get current user record, create if doesn't exist
      let { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('clerk_id', userId)
        .single()

      if (!userRecord) {
      console.log('Squad API - User not found in database, creating...')

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
          .select('id, email')
          .single()

        if (insertError) {
          console.error('Error creating user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user in database' }, { status: 500 })
        }

        userRecord = newUser
        console.log('Squad API - User created successfully:', userRecord)
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)

        // Fallback: create user with minimal information
        const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`
        console.log('Squad API - Creating user with fallback info, email:', fallbackEmail)

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: userId,
            email: fallbackEmail,
            first_name: 'User',
            last_name: '',
            is_admin: false
          })
          .select('id, email')
          .single()

        if (insertError) {
          console.error('Error creating fallback user in database:', insertError)
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        userRecord = newUser
        console.log('Squad API - Fallback user created successfully:', userRecord)
      }
    }

      targetUserId = userRecord.id
    }

    // Get league details
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Get manager's assigned players for this league
    console.log('Squad API - Looking for players with manager_id:', targetUserId)
    // CRITICAL: Filter by league to prevent cross-league player confusion
    const { data: initialPlayers, error } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('manager_id', targetUserId)
      .eq('league', league.name)
      .order('position')
      .order('name')

    let players = initialPlayers

    console.log('Squad API - Found players:', players?.length || 0)

    if (error) {
      console.error('Error fetching squad:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no players found and NOT admin request, try to find and fix orphaned players
    if (!players || players.length === 0) {
      if (managerId) {
        // For admin requests, just return empty array if no players found
        console.log('Squad API - No players found for manager:', managerId)
      } else {
        console.log('Squad API - No players found, checking for orphaned players...')

      // Get current user email for matching
      const currentUserEmail = (await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', targetUserId)
        .single()).data?.email || ''
      console.log('Squad API - Current user email:', currentUserEmail)

      // Look for duplicate users with the same email but different IDs
      const { data: duplicateUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, clerk_id, created_at')
        .eq('email', currentUserEmail)
        .neq('id', targetUserId!)

      console.log('Squad API - Found duplicate users:', duplicateUsers)

      // Also check for players assigned to ANY user with this email (including current user)
      const { data: allUsersWithEmail } = await supabaseAdmin
        .from('users')
        .select('id, email, clerk_id, created_at')
        .eq('email', currentUserEmail)

      console.log('Squad API - All users with this email:', allUsersWithEmail)

      if (allUsersWithEmail && allUsersWithEmail.length > 0) {
        const allUserIds = allUsersWithEmail.map(u => u.id)
        // CRITICAL: Filter by league to prevent cross-league player confusion
        const { data: playersForAllUsers } = await supabaseAdmin
          .from('players')
          .select('id, name, position, manager_id')
          .in('manager_id', allUserIds)
          .eq('league', league.name)

        console.log('Squad API - Players assigned to users with this email:', playersForAllUsers)
      }

      // Look for players assigned to any of these duplicate user IDs
      let orphanedPlayers = []
      if (duplicateUsers && duplicateUsers.length > 0) {
        const duplicateIds = duplicateUsers.map(u => u.id)

        // CRITICAL: Filter by league to prevent cross-league player confusion
        const { data: foundPlayers } = await supabaseAdmin
          .from('players')
          .select('*')
          .in('manager_id', duplicateIds)
          .eq('league', league.name)

        if (foundPlayers && foundPlayers.length > 0) {
          orphanedPlayers = foundPlayers
          console.log('Squad API - Found orphaned players to reassign:', foundPlayers.length)

          // Reassign all orphaned players to current user
          const { error: updateError } = await supabaseAdmin
            .from('players')
            .update({ manager_id: targetUserId })
            .in('manager_id', duplicateIds)

          if (updateError) {
            console.error('Squad API - Error reassigning players:', updateError)
          } else {
            console.log('Squad API - Successfully reassigned players to current user')

            // Fetch the updated players
            // CRITICAL: Filter by league to prevent cross-league player confusion
            const { data: updatedPlayers } = await supabaseAdmin
              .from('players')
              .select('*')
              .eq('manager_id', targetUserId)
              .eq('league', league.name)
              .order('position')
              .order('name')

            players = updatedPlayers
            console.log('Squad API - Updated player count:', players?.length || 0)
          }
        }
      }
      }
    }

    // Get the next incomplete gameweek for the league (sorted by week)
    const { data: currentGameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('*')
      .eq('league_id', leagueId)
      .eq('is_completed', false)
      .order('week', { ascending: true })
      .limit(1)
      .single()

    // Get existing lineup if any
    let currentLineup = null
    if (currentGameweek && targetUserId) {
      const { data: lineup } = await supabaseAdmin
        .from('lineups')
        .select('*')
        .eq('manager_id', targetUserId)
        .eq('gameweek_id', currentGameweek.id)
        .single()

      currentLineup = lineup
    }

    // Get default lineup for this league
    let defaultLineup = null
    if (targetUserId) {
      const { data: defLineup } = await supabaseAdmin
        .from('default_lineups')
        .select('*')
        .eq('manager_id', targetUserId)
        .eq('league_id', leagueId)
        .single()

      defaultLineup = defLineup
    }

    // Check if there's a cup gameweek for this league gameweek
    let currentCupGameweek = null
    let currentCupLineup = null
    let cup = null

    if (currentGameweek) {
      // Check if league has a cup
      const { data: cupData } = await supabaseAdmin
        .from('cups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .single()

      if (cupData) {
        cup = cupData

        // Check if current league gameweek has a cup gameweek mapped to it
        const { data: cupGameweek } = await supabaseAdmin
          .from('cup_gameweeks')
          .select('*')
          .eq('cup_id', cupData.id)
          .eq('league_gameweek_id', currentGameweek.id)
          .single()

        if (cupGameweek) {
          currentCupGameweek = cupGameweek

          // Get existing cup lineup if any
          if (targetUserId) {
            const { data: cupLineup } = await supabaseAdmin
              .from('cup_lineups')
              .select('*')
              .eq('manager_id', targetUserId)
              .eq('cup_gameweek_id', cupGameweek.id)
              .single()

            currentCupLineup = cupLineup
          }
        }
      }
    }

    // Get default cup lineup if cup exists
    let defaultCupLineup = null
    if (cup && targetUserId) {
      const { data: defCupLineup } = await supabaseAdmin
        .from('default_cup_lineups')
        .select('*')
        .eq('manager_id', targetUserId)
        .eq('cup_id', cup.id)
        .single()

      defaultCupLineup = defCupLineup
    }

    return NextResponse.json({
      league,
      players: players || [],
      currentGameweek,
      currentLineup,
      defaultLineup,
      cup,
      currentCupGameweek,
      currentCupLineup,
      defaultCupLineup,
      isDualGameweek: !!(currentGameweek && currentCupGameweek)
    })
  } catch (error) {
    console.error('Error in squad API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}