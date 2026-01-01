import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { LEAGUE_LIMITS, SEASON_FORMAT, VALIDATION_MESSAGES } from '@/config/constants'

export async function GET() {
  try {
    const { userId } = await auth()
    console.log('GET /api/leagues - userId:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the user's internal ID from Clerk ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      // If user doesn't exist yet, return empty array
      return NextResponse.json({ leagues: [] })
    }

    // Fetch only leagues where this user is the admin
    console.log('Fetching leagues for admin_id:', userRecord.id)
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('admin_id', userRecord.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('Leagues query result:', { data, error })

    if (error) {
      console.error('Error fetching leagues:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ leagues: data })
  } catch (error) {
    console.error('GET leagues catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    console.log('POST /api/leagues - userId:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    console.log('Request body:', requestBody)
    const {
      name,
      season
    } = requestBody

    // Generate season from current year if not provided
    const currentSeason = season || SEASON_FORMAT.generate()

    // Create a minimal user record first, then the league
    // NOTE: is_admin is NOT set - that's reserved for super admins only
    // This user becomes admin of THIS league via admin_id, not a global admin
    console.log('Creating/updating user record for userId:', userId)
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        clerk_id: userId,
        email: `admin-${userId}@temp.com`,
        first_name: 'Admin',
        last_name: 'User'
        // Removed is_admin: true - league creators are NOT global admins
      }, {
        onConflict: 'clerk_id'
      })
      .select('id')
      .single()

    console.log('User record result:', { userRecord, userError })

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json({ error: `User creation failed: ${userError.message}` }, { status: 500 })
    }

    const adminId = userRecord?.id || crypto.randomUUID() // Fallback UUID
    console.log('Using adminId:', adminId)

    // Check 5 league limit for this user
    const { data: existingLeagues, error: countError } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('admin_id', adminId)
      .eq('is_active', true)

    console.log('Checking league count for user:', adminId, 'found:', existingLeagues?.length || 0)

    if (countError) {
      console.error('Error counting user leagues:', countError)
      return NextResponse.json({ error: 'Failed to verify league limit' }, { status: 500 })
    }

    if (existingLeagues && existingLeagues.length >= LEAGUE_LIMITS.MAX_PER_USER) {
      return NextResponse.json({
        error: VALIDATION_MESSAGES.LEAGUE_LIMIT_REACHED
      }, { status: 400 })
    }

    console.log('Creating league with data:', {
      name,
      admin_id: adminId,
      season: currentSeason,
      current_gameweek: 1,
      is_active: true
    })

    // Create league
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .insert({
        name,
        admin_id: adminId,
        season: currentSeason,
        current_gameweek: 1,
        is_active: true
      })
      .select('*')
      .single()

    console.log('League creation result:', { league, leagueError })

    if (leagueError) {
      console.error('League creation error:', leagueError)
      return NextResponse.json({ error: leagueError.message }, { status: 500 })
    }

    console.log('Successfully created league:', league.id)

    return NextResponse.json({
      league,
      message: 'League created successfully. You can now add managers and generate the schedule.'
    })
  } catch (error) {
    console.error('POST leagues catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}