import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { LEAGUE_LIMITS, SEASON_FORMAT, VALIDATION_MESSAGES } from '@/config/constants'

export async function GET() {
  try {
    const { userId } = await auth()
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
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('admin_id', userRecord.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })


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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    const {
      name,
      season,
      maxManagers
    } = requestBody

    // Generate season from current year if not provided
    const currentSeason = season || SEASON_FORMAT.generate()

    // Resolve and validate the admin-defined league size (default 18).
    const managerCount = maxManagers == null ? LEAGUE_LIMITS.DEFAULT_MANAGERS : Number(maxManagers)
    if (
      !Number.isInteger(managerCount) ||
      managerCount < LEAGUE_LIMITS.MIN_MANAGERS ||
      managerCount > LEAGUE_LIMITS.MAX_MANAGERS
    ) {
      return NextResponse.json({ error: VALIDATION_MESSAGES.INVALID_MANAGER_COUNT }, { status: 400 })
    }

    // Ensure the creator's user record exists, using their REAL Clerk profile
    // (name + email). Previously this upserted placeholder values
    // ("Admin User" / admin-<clerkId>@temp.com), which clobbered the user's
    // real profile every time they created a league.
    // NOTE: is_admin is NOT set - that's reserved for super admins only.
    // This user becomes admin of THIS league via league_admins, not globally.
    let creatorEmail = `admin-${userId}@temp.com`
    let creatorFirst = 'Admin'
    let creatorLast = 'User'
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const { firstName, lastName } = resolveUserNames({
        email,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        username: clerkUser.username,
      })
      if (email) creatorEmail = email
      creatorFirst = firstName
      creatorLast = lastName
    } catch (clerkErr) {
      console.error('Could not fetch Clerk profile for league creator, falling back to placeholder:', clerkErr)
    }

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        clerk_id: userId,
        email: creatorEmail,
        first_name: creatorFirst,
        last_name: creatorLast
      }, {
        onConflict: 'clerk_id'
      })
      .select('id')
      .single()


    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json({ error: `User creation failed: ${userError.message}` }, { status: 500 })
    }

    const adminId = userRecord?.id || crypto.randomUUID() // Fallback UUID

    // Check 5 league limit for this user
    const { data: existingLeagues, error: countError } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('admin_id', adminId)
      .eq('is_active', true)


    if (countError) {
      console.error('Error counting user leagues:', countError)
      return NextResponse.json({ error: 'Failed to verify league limit' }, { status: 500 })
    }

    if (existingLeagues && existingLeagues.length >= LEAGUE_LIMITS.MAX_PER_USER) {
      return NextResponse.json({
        error: VALIDATION_MESSAGES.LEAGUE_LIMIT_REACHED
      }, { status: 400 })
    }

    // Create league
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .insert({
        name,
        admin_id: adminId,
        season: currentSeason,
        current_gameweek: 1,
        max_managers: managerCount,
        is_active: true
      })
      .select('*')
      .single()


    if (leagueError) {
      console.error('League creation error:', leagueError)
      return NextResponse.json({ error: leagueError.message }, { status: 500 })
    }

    // Register the creator as a league admin. Admin access is resolved via the
    // league_admins junction table (not the deprecated leagues.admin_id), so a
    // new league MUST have a row here or its creator is denied the admin area.
    const { error: adminInsertError } = await supabaseAdmin
      .from('league_admins')
      .insert({ league_id: league.id, user_id: adminId, created_by: adminId })

    if (adminInsertError && adminInsertError.code !== '23505') {
      console.error('Error registering league admin:', adminInsertError)
      return NextResponse.json(
        { error: 'League created but admin registration failed. Please try again.' },
        { status: 500 }
      )
    }


    // Bust the cached dashboard league lists so the new league appears immediately.
    revalidateTag('user-leagues', 'max')
    revalidatePath('/leagues')

    return NextResponse.json({
      league,
      message: 'League created successfully. You can now add managers and generate the schedule.'
    })
  } catch (error) {
    console.error('POST leagues catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}