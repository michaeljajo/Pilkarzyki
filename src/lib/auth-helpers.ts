import { supabaseAdmin } from '@/lib/supabase'

/**
 * Verifies that a user is the admin of a specific league
 * @param clerkUserId - The Clerk user ID
 * @param leagueId - The league ID to check
 * @returns Object with isAdmin boolean and optional userInternalId
 */
export async function verifyLeagueAdmin(clerkUserId: string, leagueId: string): Promise<{
  isAdmin: boolean
  userInternalId?: string
  error?: string
}> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return { isAdmin: false, error: 'User not found' }
    }

    // Get league and check admin_id
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('admin_id')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return { isAdmin: false, error: 'League not found' }
    }

    // Check if user is the admin
    const isAdmin = league.admin_id === userRecord.id

    return {
      isAdmin,
      userInternalId: userRecord.id,
      error: isAdmin ? undefined : 'You are not the admin of this league'
    }
  } catch (error) {
    console.error('Error verifying league admin:', error)
    return { isAdmin: false, error: 'Internal server error' }
  }
}

/**
 * Checks if a user administers any leagues
 * @param clerkUserId - The Clerk user ID
 * @returns Boolean indicating if user is admin of any league
 */
export async function userAdminsAnyLeague(clerkUserId: string): Promise<boolean> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return false
    }

    // Check if user is admin of any league
    const { data: leagues, error: leaguesError } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('admin_id', userRecord.id)
      .eq('is_active', true)
      .limit(1)

    if (leaguesError) {
      console.error('Error checking leagues:', leaguesError)
      return false
    }

    return leagues && leagues.length > 0
  } catch (error) {
    console.error('Error checking if user admins any league:', error)
    return false
  }
}

/**
 * Gets leagues where the user is a manager (has a squad)
 * @param clerkUserId - The Clerk user ID
 * @returns Array of league IDs where user is a manager
 */
export async function getUserManagedLeagueIds(clerkUserId: string): Promise<string[]> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return []
    }

    // Get squads where user is the manager
    const { data: squads, error: squadsError} = await supabaseAdmin
      .from('squads')
      .select('league_id')
      .eq('manager_id', userRecord.id)

    if (squadsError) {
      console.error('Error fetching user squads:', squadsError)
      return []
    }

    return squads?.map(squad => squad.league_id) || []
  } catch (error) {
    console.error('Error getting user managed leagues:', error)
    return []
  }
}