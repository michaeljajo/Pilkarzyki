import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { validateLineup } from '@/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameweekId = searchParams.get('gameweekId')

    if (!gameweekId) {
      return NextResponse.json({ error: 'gameweekId is required' }, { status: 400 })
    }

    // Get user record, create if doesn't exist
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      console.log('Lineup API - User not found in database, creating...')

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
        console.log('Lineup API - User created successfully:', userRecord)
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)

        // Fallback: create user with minimal information
        const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`
        console.log('Lineup API - Creating user with fallback info, email:', fallbackEmail)

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
        console.log('Lineup API - Fallback user created successfully:', userRecord)
      }
    }

    // Get lineup for this manager and gameweek
    const { data: lineup, error } = await supabaseAdmin
      .from('lineups')
      .select(`
        *,
        gameweek:gameweeks(*)
      `)
      .eq('manager_id', userRecord.id)
      .eq('gameweek_id', gameweekId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lineup: lineup || null })
  } catch (error) {
    console.error('Error fetching lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameweekId, playerIds } = await request.json()

    if (!gameweekId || !Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'gameweekId and playerIds array are required' }, { status: 400 })
    }

    // Get user record, create if doesn't exist
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      console.log('Lineup API - User not found in database, creating...')

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
        console.log('Lineup API - User created successfully:', userRecord)
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError)

        // Fallback: create user with minimal information
        const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`
        console.log('Lineup API - Creating user with fallback info, email:', fallbackEmail)

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
        console.log('Lineup API - Fallback user created successfully:', userRecord)
      }
    }

    // Check if gameweek is locked
    const { data: gameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('lock_date')
      .eq('id', gameweekId)
      .single()

    if (!gameweek) {
      return NextResponse.json({ error: 'Gameweek not found' }, { status: 404 })
    }

    if (new Date() > new Date(gameweek.lock_date)) {
      return NextResponse.json({ error: 'Cannot modify lineup after lock date' }, { status: 400 })
    }

    // Validate lineup if playerIds provided
    if (playerIds.length > 0) {
      // Get player details for validation
      const { data: players } = await supabaseAdmin
        .from('players')
        .select('*')
        .in('id', playerIds)

      if (players) {
        const validation = validateLineup(players)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
        }
      }
    }

    // Create or update lineup
    const { data: lineup, error } = await supabaseAdmin
      .from('lineups')
      .upsert({
        manager_id: userRecord.id,
        gameweek_id: gameweekId,
        player_ids: playerIds,
        is_locked: false,
        total_goals: 0
      }, {
        onConflict: 'manager_id,gameweek_id'
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lineup })
  } catch (error) {
    console.error('Error creating/updating lineup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}